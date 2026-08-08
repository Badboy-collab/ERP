import { prisma } from "@/lib/prisma";

export type TransactionType = "SALES" | "DELIVERY" | "TRANSFER_OUT" | "TRANSFER_IN" | "FACTORY_RETURN";

export interface InvoiceItemInput {
  product_id: string;
  lot_id: string;
  quantity: number;
  unit_price?: number;
}

export interface CreateInvoiceTransactionInput {
  depot_id: string;
  invoice_no: string;
  transaction_type: TransactionType;
  dealer_id?: string;
  order_id?: string;
  destination?: string;
  notes?: string;
  manual_challan_no?: string;
  date?: Date;
  items: InvoiceItemInput[];
}

export interface CreateReceiveInput {
  depot_id: string;
  invoice_no: string;
  supplier_challan_no?: string;
  product_id: string;
  lot_no: string;
  mfg_date: Date;
  exp_date: Date;
  quantity: number; // in Kg
  receive_date?: Date;
}

export interface CreateOrderInput {
  depot_id: string;
  dealer_id: string;
  order_no?: string;
  order_date?: Date;
  created_by?: string | null;
  remarks?: string | null;
  items: {
    product_id: string;
    ordered_qty: number;
  }[];
}

export interface PaymentInput {
  depot_id: string;
  dealer_id: string;
  amount: number;
  remarks?: string;
  date?: Date;
}

export class ERPService {
  /**
   * Get Next D.O Number
   */
  static async getNextDONumber(org_id: string, depot_id?: string, previewOnly: boolean = false) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const yy = String(yyyy).slice(-2);
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');

    let depotCode = "";
    if (depot_id) {
      const depot = await prisma.depot.findUnique({ where: { id: depot_id } });
      if (depot && depot.code) {
        depotCode = depot.code.toUpperCase().replace(/DEP-?/g, "");
      }
    }

    const sequenceName = `DO_${depotCode || 'DEFAULT'}_${yyyy}`;

    let nextSeqNum = 1;

    if (previewOnly) {
      const seq = await prisma.sequence.findUnique({
        where: { org_id_name: { org_id, name: sequenceName } }
      });
      nextSeqNum = seq ? seq.value + 1 : 1;
    } else {
      const sequence = await prisma.sequence.upsert({
        where: { org_id_name: { org_id, name: sequenceName } },
        update: { value: { increment: 1 } },
        create: { org_id, name: sequenceName, value: 1 }
      });
      nextSeqNum = sequence.value;
    }

    const prefix = depotCode ? `${depotCode}-${yy}${mm}${dd}` : `${yy}${mm}${dd}`;
    const nextSeq = String(nextSeqNum).padStart(3, '0');

    return `${prefix}${nextSeq}`;
  }

  /**
   * Record Stock Receive
   * All quantities are in Kg.
   */
  static async recordStockReceive(org_id: string, input: CreateReceiveInput) {
    if (input.quantity <= 0) {
      throw new Error("Received quantity must be greater than 0.");
    }

    return prisma.$transaction(async (tx) => {
      let lot = await tx.lotTracker.findFirst({
        where: {
          org_id,
          depot_id: input.depot_id,
          product_id: input.product_id,
          lot_no: input.lot_no,
        },
      });

      if (lot) {
        lot = await tx.lotTracker.update({
          where: { id: lot.id },
          data: {
            initial_qty: lot.initial_qty + input.quantity,
            available_qty: lot.available_qty + input.quantity,
            status: "Active",
          },
        });
      } else {
        lot = await tx.lotTracker.create({
          data: {
            org_id,
            depot_id: input.depot_id,
            product_id: input.product_id,
            lot_no: input.lot_no,
            mfg_date: new Date(input.mfg_date),
            exp_date: new Date(input.exp_date),
            initial_qty: input.quantity,
            available_qty: input.quantity,
            sold_qty: 0,
            factory_return_qty: 0,
            transfer_qty: 0,
            status: "Active",
          },
        });
      }

      const receiveLog = await tx.receiveLog.create({
        data: {
          org_id,
          depot_id: input.depot_id,
          invoice_no: input.invoice_no,
          supplier_challan_no: input.supplier_challan_no || null,
          receive_date: input.receive_date ? new Date(input.receive_date) : new Date(),
          product_id: input.product_id,
          lot_id: lot.id,
          quantity: input.quantity,
        },
      });

      return { lot, receiveLog };
    });
  }

  /**
   * Record Multi-Item Invoice Transaction
   */
  static async recordInvoiceTransaction(org_id: string, input: CreateInvoiceTransactionInput) {
    if (!input.items || input.items.length === 0) {
      throw new Error("Transaction must contain at least one item.");
    }
    if (!input.depot_id) {
      throw new Error("Depot ID is required for all transactions.");
    }

    const txDate = input.date ? new Date(input.date) : new Date();

    return prisma.$transaction(async (tx) => {
      let invoiceTotalAmount = 0;

      for (const item of input.items) {
        const qty = Number(item.quantity);
        const unit_price = item.unit_price ? Number(item.unit_price) : 0;
        if (isNaN(qty) || qty <= 0) {
          throw new Error("Quantity must be greater than 0");
        }
        invoiceTotalAmount += qty * unit_price;
      }

      const invoice = await tx.invoice.create({
        data: {
          org_id,
          depot_id: input.depot_id,
          invoice_no: input.invoice_no,
          transaction_type: input.transaction_type,
          date: txDate,
          dealer_id: input.dealer_id || null,
          order_id: input.order_id || null,
          destination: input.destination || null,
          notes: input.notes || null,
          manual_challan_no: input.manual_challan_no || null,
          total_amount: invoiceTotalAmount,
        },
      });

      for (const item of input.items) {
        const qty = Number(item.quantity);
        const unit_price = item.unit_price ? Number(item.unit_price) : 0;
        const total_amount = qty * unit_price;

        const lot = await tx.lotTracker.findUnique({
          where: { id: item.lot_id },
          include: { product: true },
        });

        if (!lot) {
          throw new Error(`Lot ID ${item.lot_id} does not exist.`);
        }

        if (lot.available_qty < qty) {
          throw new Error(
            `Error: Insufficient stock. Only ${lot.available_qty} kg available for Lot ${lot.lot_no}. Requested: ${qty} kg.`
          );
        }

        await tx.salesLog.create({
          data: {
            org_id,
            invoice_id: invoice.id,
            depot_id: input.depot_id,
            invoice_no: input.invoice_no,
            transaction_type: input.transaction_type,
            date: txDate,
            dealer_id: input.dealer_id || null,
            order_id: input.order_id || null,
            product_id: item.product_id,
            lot_id: item.lot_id,
            quantity: qty,
            unit_price: unit_price,
            total_amount: total_amount,
          },
        });

        let newSoldQty = lot.sold_qty;
        let newReturnQty = lot.factory_return_qty;
        let newTransferQty = lot.transfer_qty;

        if (input.transaction_type === "SALES" || input.transaction_type === "DELIVERY") {
          newSoldQty += qty;
        } else if (input.transaction_type === "FACTORY_RETURN") {
          newReturnQty += qty;
        } else if (input.transaction_type === "TRANSFER_OUT") {
          newTransferQty += qty;
        }

        const newAvailableQty = lot.initial_qty - newSoldQty - newReturnQty - newTransferQty;
        const newStatus = newAvailableQty <= 0 ? "Depleted" : lot.status;

        await tx.lotTracker.update({
          where: { id: lot.id },
          data: {
            sold_qty: newSoldQty,
            factory_return_qty: newReturnQty,
            transfer_qty: newTransferQty,
            available_qty: newAvailableQty,
            status: newStatus,
          },
        });

        if (input.order_id) {
          const orderItem = await tx.orderItem.findFirst({
            where: {
              order_id: input.order_id,
              product_id: item.product_id,
            },
          });

          if (orderItem) {
            const updatedDelivered = orderItem.delivered_qty + qty;
            const updatedPending = Math.max(0, orderItem.ordered_qty - updatedDelivered);

            await tx.orderItem.update({
              where: { id: orderItem.id },
              data: {
                delivered_qty: updatedDelivered,
                pending_qty: updatedPending,
              },
            });
          }
        }
      }

      if (input.order_id) {
        const orderItemsAgg = await tx.orderItem.aggregate({
          where: { order_id: input.order_id },
          _sum: { pending_qty: true, delivered_qty: true },
        });

        const totalPending = orderItemsAgg._sum.pending_qty || 0;
        const totalDelivered = orderItemsAgg._sum.delivered_qty || 0;

        let newOrderStatus = "Pending";
        if (totalPending <= 0) {
          newOrderStatus = "Complete";
        } else if (totalDelivered > 0) {
          newOrderStatus = "Partial";
        }

        await tx.deliveryOrder.update({
          where: { id: input.order_id },
          data: { status: newOrderStatus },
        });
      }

      // Auto-create a DEBIT FinancialTransaction for the dealer
      if (input.dealer_id && invoiceTotalAmount > 0 && input.transaction_type === "SALES") {
        await tx.financialTransaction.create({
          data: {
            org_id,
            depot_id: input.depot_id,
            dealer_id: input.dealer_id,
            type: "DEBIT",
            amount: invoiceTotalAmount,
            date: txDate,
            remarks: `Sales Invoice ${input.invoice_no}`,
            reference_invoice: invoice.id,
          }
        });

        const dealer = await tx.dealer.findUnique({ where: { id: input.dealer_id } });
        if (dealer) {
          await tx.dealer.update({
            where: { id: input.dealer_id },
            data: { current_balance: dealer.current_balance + invoiceTotalAmount }
          });
        }
      }

      return tx.invoice.findUnique({
        where: { id: invoice.id },
        include: {
          depot: true,
          dealer: true,
          order: true,
          items: {
            include: {
              product: true,
              lot: true,
            },
          },
        },
      });
    });
  }

  /**
   * FIFO Lot Suggestion
   */
  static async suggestFIFOLot(org_id: string, product_id: string, depot_id?: string) {
    return prisma.lotTracker.findFirst({
      where: {
        org_id,
        product_id,
        ...(depot_id ? { depot_id } : {}),
        available_qty: { gt: 0 },
        status: { not: "Expired" },
      },
      orderBy: { exp_date: "asc" },
    });
  }

  /**
   * Fetch Delivery Order details for Auto-Population
   */
  static async getDeliveryOrderForAutoPopulate(org_id: string, order_id: string) {
    const order = await prisma.deliveryOrder.findFirst({
      where: { id: order_id, org_id },
      include: {
        dealer: true,
        depot: true,
        items: {
          where: { pending_qty: { gt: 0 } },
          include: { product: true },
        },
      },
    });

    if (!order) return null;

    const itemsWithFifoLots = await Promise.all(
      order.items.map(async (item) => {
        const fifoLot = await ERPService.suggestFIFOLot(org_id, item.product_id, order.depot_id);
        return {
          ...item,
          suggestedLot: fifoLot,
        };
      })
    );

    return {
      ...order,
      items: itemsWithFifoLots,
    };
  }

  /**
   * Create Delivery Order
   */
  static async createDeliveryOrder(org_id: string, input: CreateOrderInput) {
    const final_order_no = await ERPService.getNextDONumber(org_id, input.depot_id, false);

    return prisma.deliveryOrder.create({
      data: {
        org_id,
        depot_id: input.depot_id,
        dealer_id: input.dealer_id,
        order_no: final_order_no,
        order_date: input.order_date ? new Date(input.order_date) : new Date(),
        status: "Pending",
        remarks: input.remarks || null,
        created_by: input.created_by || null,
        items: {
          create: input.items.map((item) => ({
            product_id: item.product_id,
            ordered_qty: item.ordered_qty,
            delivered_qty: 0,
            pending_qty: item.ordered_qty,
          })),
        },
      },
      include: {
        items: { include: { product: true } },
        dealer: true,
        depot: true,
      },
    });
  }

  static async updateDeliveryOrder(input: {
    org_id: string;
    id: string;
    dealer_id?: string;
    order_date?: Date;
    remarks?: string | null;
    status?: string;
    items?: { id?: string; product_id: string; ordered_qty: number }[];
  }) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.deliveryOrder.findUnique({
        where: { id: input.id },
        include: { items: true },
      });

      if (!order) throw new Error("Delivery order not found.");

      const updatedItems = input.items ?? order.items.map((item) => ({
        id: item.id,
        product_id: item.product_id,
        ordered_qty: item.ordered_qty,
      }));

      const existingItemsById = new Map(order.items.map((item) => [item.id, item]));
      const updatedItemIds = new Set<string>();

      for (const item of updatedItems) {
        if (item.id) {
          const existing = existingItemsById.get(item.id);
          if (!existing) throw new Error(`Order item ${item.id} not found.`);
          if (existing.delivered_qty > item.ordered_qty) {
            throw new Error(
              `Cannot reduce ordered quantity for product ${existing.product_id} below already delivered quantity (${existing.delivered_qty} kg). Reverse dispatch records first.`
            );
          }
          if (existing.delivered_qty > 0 && existing.product_id !== item.product_id) {
            throw new Error("Cannot change product for an order item that has already been delivered.");
          }
          updatedItemIds.add(item.id);
        }
      }

      for (const existing of order.items) {
        if (!updatedItemIds.has(existing.id) && existing.delivered_qty > 0) {
          throw new Error(
            `Cannot remove product ${existing.product_id} because some quantity has already been delivered. Reverse dispatch records first.`
          );
        }
      }

      // Delete removed line items that have no deliveries.
      for (const existing of order.items) {
        if (!updatedItemIds.has(existing.id)) {
          await tx.orderItem.delete({ where: { id: existing.id } });
        }
      }

      const updatedItemRecords = [] as { id: string; ordered_qty: number; delivered_qty: number; pending_qty: number }[];
      for (const item of updatedItems) {
        if (item.id) {
          const existing = existingItemsById.get(item.id)!;
          const deliveredQty = existing.delivered_qty;
          const pendingQty = Math.max(0, item.ordered_qty - deliveredQty);
          await tx.orderItem.update({
            where: { id: item.id },
            data: {
              product_id: item.product_id,
              ordered_qty: item.ordered_qty,
              pending_qty: pendingQty,
            },
          });
          updatedItemRecords.push({ id: item.id, ordered_qty: item.ordered_qty, delivered_qty: deliveredQty, pending_qty: pendingQty });
        } else {
          const pendingQty = item.ordered_qty;
          const created = await tx.orderItem.create({
            data: {
              order_id: order.id,
              product_id: item.product_id,
              ordered_qty: item.ordered_qty,
              delivered_qty: 0,
              pending_qty: pendingQty,
            },
          });
          updatedItemRecords.push({ id: created.id, ordered_qty: created.ordered_qty, delivered_qty: created.delivered_qty, pending_qty: created.pending_qty });
        }
      }

      const totalPending = updatedItemRecords.reduce((sum, item) => sum + item.pending_qty, 0);
      const totalDelivered = updatedItemRecords.reduce((sum, item) => sum + item.delivered_qty, 0);
      const computedStatus = totalPending === 0 ? "Complete" : totalDelivered > 0 ? "Partial" : "Pending";
      const finalStatus = input.status ? input.status : computedStatus;

      const updatedOrder = await tx.deliveryOrder.update({
        where: { id: order.id },
        data: {
          dealer_id: input.dealer_id || order.dealer_id,
          order_date: input.order_date ? new Date(input.order_date) : order.order_date,
          remarks: input.remarks !== undefined ? input.remarks : order.remarks,
          status: finalStatus,
        },
      });

      return await tx.deliveryOrder.findUnique({
        where: { id: updatedOrder.id },
        include: { items: { include: { product: true } }, dealer: true, depot: true },
      });
    });
  }

  static async deleteDeliveryOrder(input: { org_id: string; id: string }) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.deliveryOrder.findUnique({
        where: { id: input.id },
        include: { items: true, salesLogs: true },
      });

      if (!order) throw new Error("Delivery order not found.");
      if (order.salesLogs.length > 0) {
        throw new Error("Cannot delete delivery order while there are related sales dispatch records. Reverse dispatch records first.");
      }

      await tx.deliveryOrder.delete({ where: { id: order.id } });

      return { message: "Delivery order deleted successfully" };
    });
  }

  /**
   * Real-Time Stock Display
   */
  static async getRealtimeStockReport(org_id: string, depot_id?: string, asOfDate?: string) {
    const products = await prisma.product.findMany({
      where: { org_id },
      orderBy: [{ sort_order: "asc" }, { category: "asc" }, { code: "asc" }],
    });

    const depotFilter = depot_id ? { depot_id } : {};
    const dateFilter = asOfDate ? { lte: new Date(asOfDate + "T23:59:59.999Z") } : undefined;

    return Promise.all(
      products.map(async (prod) => {
        const bagSize = prod.bag_size_kg || 50.0;

        const rxAgg = await prisma.receiveLog.aggregate({
          where: {
            org_id,
            product_id: prod.id,
            ...depotFilter,
            ...(dateFilter ? { receive_date: dateFilter } : {}),
          },
          _sum: { quantity: true },
        });

        const salesAgg = await prisma.salesLog.aggregate({
          where: {
            org_id,
            product_id: prod.id,
            transaction_type: { in: ["SALES", "DELIVERY"] },
            ...depotFilter,
            ...(dateFilter ? { date: dateFilter } : {}),
          },
          _sum: { quantity: true },
        });

        const returnAgg = await prisma.salesLog.aggregate({
          where: {
            org_id,
            product_id: prod.id,
            transaction_type: "FACTORY_RETURN",
            ...depotFilter,
            ...(dateFilter ? { date: dateFilter } : {}),
          },
          _sum: { quantity: true },
        });

        let openingKg = 0;
        if (depot_id) {
          const openingLots = await prisma.lotTracker.aggregate({
            where: {
              org_id,
              product_id: prod.id,
              depot_id,
              lot_no: { startsWith: "OPENING" },
              ...(dateFilter ? { createdAt: dateFilter } : {}),
            },
            _sum: { initial_qty: true }
          });
          openingKg = openingLots._sum.initial_qty || 0;
        } else {
          const openingLots = await prisma.lotTracker.aggregate({
            where: {
              org_id,
              product_id: prod.id,
              lot_no: { startsWith: "OPENING" },
              ...(dateFilter ? { createdAt: dateFilter } : {}),
            },
            _sum: { initial_qty: true }
          });
          openingKg = (prod.opening_stock || 0) + (openingLots._sum.initial_qty || 0);
        }
        const openingBags = bagSize > 0 ? openingKg / bagSize : 0;

        const receivedKg = rxAgg._sum.quantity || 0;
        const receivedBags = bagSize > 0 ? receivedKg / bagSize : 0;

        const salesKg = salesAgg._sum.quantity || 0;
        const salesBags = bagSize > 0 ? salesKg / bagSize : 0;

        const returnKg = returnAgg._sum.quantity || 0;
        const returnBags = bagSize > 0 ? returnKg / bagSize : 0;

        const totalKg = openingKg + receivedKg;
        const balanceKg = totalKg - salesKg - returnKg;
        const balanceBags = bagSize > 0 ? balanceKg / bagSize : 0;

        return {
          product_id: prod.id,
          category: prod.category,
          name: prod.name,
          code: prod.code,
          bag_size_kg: bagSize,

          opening_bags: Math.round(openingBags * 100) / 100,
          opening_kg: openingKg,

          received_bags: Math.round(receivedBags * 100) / 100,
          received_kg: receivedKg,

          total_kg: totalKg,

          sales_bags: Math.round(salesBags * 100) / 100,
          sales_kg: salesKg,

          return_bags: Math.round(returnBags * 100) / 100,
          return_kg: returnKg,

          balance_kg: balanceKg,
          balance_bags: Math.round(balanceBags * 100) / 100,
        };
      })
    );
  }

  /**
   * Expiry Report Generation
   */
  static async getDetailedExpiryReport(org_id: string, depot_id?: string) {
    const activeLots = await prisma.lotTracker.findMany({
      where: {
        org_id,
        available_qty: { gt: 0 },
        lot_no: { not: { startsWith: "OPENING" } },
        ...(depot_id ? { depot_id } : {}),
      },
      include: {
        product: true,
        depot: true,
      },
    });

    const now = new Date();

    const report = activeLots.map((lot) => {
      const expDate = new Date(lot.exp_date);
      const diffTime = expDate.getTime() - now.getTime();
      const daysToExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const bagSize = lot.product.bag_size_kg || 50.0;
      const availableKg = lot.available_qty;
      const availableBags = bagSize > 0 ? availableKg / bagSize : 0;

      let status: "URGENT" | "WARNING" | "CAUTION" | "ACTIVE" | "EXPIRED" = "ACTIVE";
      if (daysToExpiry <= 0) {
        status = "EXPIRED";
      } else if (daysToExpiry <= 10) {
        status = "URGENT";
      } else if (daysToExpiry <= 20) {
        status = "WARNING";
      } else if (daysToExpiry <= 30) {
        status = "CAUTION";
      }

      return {
        lot_id: lot.id,
        depot_name: lot.depot.name,
        product_name: lot.product.name,
        product_code: lot.product.code,
        lot_no: lot.lot_no,
        available_bag: Math.round(availableBags * 100) / 100,
        available_kg: availableKg,
        mfg_date: lot.mfg_date,
        exp_date: lot.exp_date,
        days_to_expiry: daysToExpiry,
        status,
      };
    });

    return report.sort((a, b) => a.days_to_expiry - b.days_to_expiry);
  }

  /**
   * Lot Reconciliation
   */
  static async getLotReconciliation(org_id: string, depot_id?: string) {
    const products = await prisma.product.findMany({ where: { org_id } });

    return Promise.all(
      products.map(async (prod) => {
        const depotFilter = depot_id ? { depot_id } : {};

        const lotAgg = await prisma.lotTracker.aggregate({
          where: { org_id, product_id: prod.id, ...depotFilter },
          _sum: { available_qty: true },
        });
        const totalLotAvailable = lotAgg._sum.available_qty || 0;

        const rxAgg = await prisma.receiveLog.aggregate({
          where: { org_id, product_id: prod.id, ...depotFilter },
          _sum: { quantity: true },
        });
        const salesAgg = await prisma.salesLog.aggregate({
          where: { org_id, product_id: prod.id, transaction_type: { in: ["SALES", "DELIVERY"] }, ...depotFilter },
          _sum: { quantity: true },
        });
        const retAgg = await prisma.salesLog.aggregate({
          where: { org_id, product_id: prod.id, transaction_type: "FACTORY_RETURN", ...depotFilter },
          _sum: { quantity: true },
        });
        const trfAgg = await prisma.salesLog.aggregate({
          where: { org_id, product_id: prod.id, transaction_type: "TRANSFER_OUT", ...depotFilter },
          _sum: { quantity: true },
        });

        const totalReceived = rxAgg._sum.quantity || 0;
        const totalSales = salesAgg._sum.quantity || 0;
        const totalReturns = retAgg._sum.quantity || 0;
        const totalTransfers = trfAgg._sum.quantity || 0;

        const calculatedRunningStock =
          prod.opening_stock + totalReceived - (totalSales + totalReturns + totalTransfers);

        const discrepancy = totalLotAvailable - calculatedRunningStock;

        return {
          product_id: prod.id,
          code: prod.code,
          name: prod.name,
          total_lot_available: totalLotAvailable,
          calculated_running_stock: calculatedRunningStock,
          discrepancy,
          isBalanced: discrepancy === 0,
        };
      })
    );
  }

  /**
   * Get Dealer Ledger
   */
  static async getDealerLedger(org_id: string, dealer_id: string) {
    const transactions = await prisma.financialTransaction.findMany({
      where: { org_id, dealer_id },
      orderBy: { date: 'asc' },
      include: { depot: true },
    });

    let running_balance = 0;
    const ledger = transactions.map(tx => {
      if (tx.type === 'DEBIT') {
        running_balance += tx.amount;
      } else if (tx.type === 'CREDIT') {
        running_balance -= tx.amount;
      }
      return {
        ...tx,
        running_balance
      };
    });

    return ledger;
  }

  /**
   * Get Depot Financial Summary
   */
  static async getDepotFinancialSummary(org_id: string, depot_id?: string) {
    const filter = depot_id ? { depot_id } : {};
    
    const debitsAgg = await prisma.financialTransaction.aggregate({
      where: { org_id, ...filter, type: 'DEBIT' },
      _sum: { amount: true }
    });
    
    const creditsAgg = await prisma.financialTransaction.aggregate({
      where: { org_id, ...filter, type: 'CREDIT' },
      _sum: { amount: true }
    });

    const total_sales = debitsAgg._sum.amount || 0;
    const total_received = creditsAgg._sum.amount || 0;
    const total_due = total_sales - total_received;

    return {
      total_sales,
      total_received,
      total_due
    };
  }

  /**
   * Record Payment (CREDIT)
   */
  static async recordPayment(org_id: string, input: PaymentInput) {
    return prisma.$transaction(async (tx) => {
      const txDate = input.date ? new Date(input.date) : new Date();

      const transaction = await tx.financialTransaction.create({
        data: {
          org_id,
          depot_id: input.depot_id,
          dealer_id: input.dealer_id,
          type: "CREDIT",
          amount: input.amount,
          date: txDate,
          remarks: input.remarks || "Payment Received",
        }
      });

      const dealer = await tx.dealer.findUnique({ where: { id: input.dealer_id } });
      if (dealer) {
        await tx.dealer.update({
          where: { id: input.dealer_id },
          data: { current_balance: dealer.current_balance - input.amount }
        });
      }

      return transaction;
    });
  }

  // Petty Cash Categories
  static FUND_INFLOW_CATEGORIES = [
    "Opening Balance",
    "Received From H / O (Head Office)",
    "LOAN"
  ];

  static EXPENSE_CATEGORIES = [
    "Load unload Bill",
    "Entertainment",
    "Conveyance",
    "Unloading Labor bill",
    "Loading Labor bill",
    "Electric Materials",
    "Stationery",
    "Internet Bill",
    "Office Maintenance",
    "Computer Servicing",
    "Paper Bill",
    "Transport Bill",
    "Courier & Postage Bill",
    "Electric Bill",
    "Printing & Photocopy",
    "Godown Rent",
    "Misc. Expenses",
    "Ifter Bill",
    "Carriage Outward Cost"
  ];

  /**
   * Record Depot Petty Cash Transaction (INCOME/EXPENSE)
   */
  static async recordDepotTransaction(org_id: string, input: {
    depot_id: string;
    transaction_type: "INCOME" | "EXPENSE";
    category: string;
    amount: number;
    date?: string | Date;
    remarks?: string;
    created_by?: string;
  }) {
    // Validate category
    const validInflow = ERPService.FUND_INFLOW_CATEGORIES.includes(input.category);
    const validExpense = ERPService.EXPENSE_CATEGORIES.includes(input.category);

    if (input.transaction_type === "INCOME" && !validInflow) {
      throw new Error(`Invalid fund inflow category: ${input.category}`);
    }
    if (input.transaction_type === "EXPENSE" && !validExpense) {
      throw new Error(`Invalid expense category: ${input.category}`);
    }

    const txDate = input.date ? new Date(input.date) : new Date();

    return prisma.depotTransaction.create({
      data: {
        org_id,
        depot_id: input.depot_id,
        transaction_type: input.transaction_type,
        category: input.category,
        amount: input.amount,
        date: txDate,
        remarks: input.remarks || "",
        created_by: input.created_by || "System",
      },
      include: {
        depot: true
      }
    });
  }

  /**
   * Get Depot Petty Cash Transactions
   */
  static async getDepotTransactions(org_id: string, depot_id?: string) {
    const filter = depot_id ? { depot_id } : {};
    return prisma.depotTransaction.findMany({
      where: { org_id, ...filter },
      include: { depot: true },
      orderBy: { date: "desc" },
    });
  }

  /**
   * Get Depot Petty Cash Balance
   */
  static async getDepotCashBalance(org_id: string, depot_id?: string) {
    const filter = depot_id ? { depot_id } : {};

    const incomeAgg = await prisma.depotTransaction.aggregate({
      where: { org_id, ...filter, transaction_type: "INCOME" },
      _sum: { amount: true },
    });

    const expenseAgg = await prisma.depotTransaction.aggregate({
      where: { org_id, ...filter, transaction_type: "EXPENSE" },
      _sum: { amount: true },
    });

    const total_income = incomeAgg._sum.amount || 0;
    const total_expense = expenseAgg._sum.amount || 0;
    const balance = total_income - total_expense;

    return {
      total_income,
      total_expense,
      balance,
    };
  }

  /**
   * System Setup: Initialize Depot Opening Stock
   */
  static async initializeOpeningStock(org_id: string, input: { depot_id: string; product_id: string; quantity: number }) {
    const product = await prisma.product.findUnique({ where: { id: input.product_id } });
    if (!product) throw new Error("Product not found");

    const lotNo = `OPENING-${product.code}`;
    
    // Check if opening lot already exists for this depot and product
    const existing = await prisma.lotTracker.findFirst({
      where: {
        org_id,
        depot_id: input.depot_id,
        product_id: input.product_id,
        lot_no: lotNo
      }
    });

    if (existing) {
      return prisma.lotTracker.update({
        where: { id: existing.id },
        data: {
          initial_qty: input.quantity,
          available_qty: input.quantity,
          status: input.quantity > 0 ? "Active" : "Depleted"
        }
      });
    }

    const mfg = new Date();
    const exp = new Date();
    exp.setFullYear(mfg.getFullYear() + 10); // Far future expiry

    return prisma.lotTracker.create({
      data: {
        org_id,
        depot_id: input.depot_id,
        product_id: input.product_id,
        lot_no: lotNo,
        mfg_date: mfg,
        exp_date: exp,
        initial_qty: input.quantity,
        available_qty: input.quantity,
        status: "Active"
      }
    });
  }

  /**
   * System Setup: Initialize Opening Petty Cash Balance
   */
  static async initializeOpeningPettyCash(org_id: string, input: { depot_id: string; amount: number }) {
    // Check if opening cash balance already exists
    const existing = await prisma.depotTransaction.findFirst({
      where: {
        org_id,
        depot_id: input.depot_id,
        category: "Opening Balance"
      }
    });

    if (existing) {
      return prisma.depotTransaction.update({
        where: { id: existing.id },
        data: {
          amount: input.amount
        }
      });
    }

    return prisma.depotTransaction.create({
      data: {
        org_id,
        depot_id: input.depot_id,
        transaction_type: "INCOME",
        category: "Opening Balance",
        amount: input.amount,
        remarks: "System Initial Setup Opening Balance",
        created_by: "System Setup"
      }
    });
  }

  /**
   * TRANSACTION REVERSAL: Delete Sales Log & Restore Inventory / Ledger
   */
  static async deleteSalesLog(org_id: string, salesLogId: string) {
    return prisma.$transaction(async (tx) => {
      const salesLog = await tx.salesLog.findUnique({
        where: { id: salesLogId },
        include: { lot: true, invoice: true }
      });

      if (!salesLog) throw new Error("Sales log record not found.");

      const qty = salesLog.quantity;

      // 1. Re-add stock back to the LotTracker
      if (salesLog.lot_id) {
        const lot = await tx.lotTracker.findUnique({ where: { id: salesLog.lot_id } });
        if (lot) {
          const newAvail = lot.available_qty + qty;
          const newSold = Math.max(0, lot.sold_qty - qty);
          const newStatus = newAvail > 0 ? "Active" : lot.status;

          await tx.lotTracker.update({
            where: { id: lot.id },
            data: {
              available_qty: newAvail,
              sold_qty: newSold,
              status: newStatus,
            }
          });
        }
      }

      // 2. If linked to an order, restore pending_qty and decrease delivered_qty
      if (salesLog.order_id) {
        const orderItem = await tx.orderItem.findFirst({
          where: {
            order_id: salesLog.order_id,
            product_id: salesLog.product_id,
          }
        });

        if (orderItem) {
          const newDelivered = Math.max(0, orderItem.delivered_qty - qty);
          const newPending = orderItem.pending_qty + qty;
          await tx.orderItem.update({
            where: { id: orderItem.id },
            data: {
              delivered_qty: newDelivered,
              pending_qty: newPending,
            }
          });

          await tx.deliveryOrder.update({
            where: { id: salesLog.order_id },
            data: { status: newDelivered <= 0 ? "Pending" : "Partial" }
          });
        }
      }

      // 3. Reverse Dealer Financial Balance if this sale updated dealer ledger
      if (salesLog.dealer_id && salesLog.transaction_type === "SALES") {
        const totalAmount = qty * (salesLog.unit_price || 0);
        if (totalAmount > 0) {
          const dealer = await tx.dealer.findUnique({ where: { id: salesLog.dealer_id } });
          if (dealer) {
            await tx.dealer.update({
              where: { id: salesLog.dealer_id },
              data: { current_balance: dealer.current_balance - totalAmount }
            });
          }

          if (salesLog.invoice_id) {
            await tx.financialTransaction.deleteMany({
              where: { reference_invoice: salesLog.invoice_id }
            });
          }
        }
      }

      // 4. Delete the SalesLog
      return tx.salesLog.delete({ where: { id: salesLogId } });
    });
  }

  /**
   * TRANSACTION REVERSAL: Delete Stock Receive Log & Deduct Inventory
   */
  static async deleteStockReceive(org_id: string, receiveLogId: string) {
    return prisma.$transaction(async (tx) => {
      const receiveLog = await tx.receiveLog.findUnique({
        where: { id: receiveLogId },
        include: { lot: true }
      });

      if (!receiveLog) throw new Error("Stock receive log record not found.");

      const qty = receiveLog.quantity;

      // Deduct stock from the corresponding LotTracker
      if (receiveLog.lot_id) {
        const lot = await tx.lotTracker.findUnique({ where: { id: receiveLog.lot_id } });
        if (lot) {
          const newInit = Math.max(0, lot.initial_qty - qty);
          const newAvail = Math.max(0, lot.available_qty - qty);
          const newStatus = newAvail <= 0 ? "Depleted" : lot.status;

          await tx.lotTracker.update({
            where: { id: lot.id },
            data: {
              initial_qty: newInit,
              available_qty: newAvail,
              status: newStatus,
            }
          });
        }
      }

      // Delete the ReceiveLog
      return tx.receiveLog.delete({ where: { id: receiveLogId } });
    });
  }

  /**
   * MASTER OVERRIDE: Update Sales Log & Adjust Inventory / Order / Dealer Balance
   */
  static async updateSalesLog(org_id: string, input: { id: string; quantity: number; unit_price?: number; date?: Date }) {
    return prisma.$transaction(async (tx) => {
      const salesLog = await tx.salesLog.findUnique({
        where: { id: input.id },
        include: { lot: true, invoice: true }
      });

      if (!salesLog) throw new Error("Sales log record not found.");

      const oldQty = salesLog.quantity;
      const newQty = Number(input.quantity);
      const deltaQty = newQty - oldQty; // Positive = sale increased, Negative = sale decreased

      if (salesLog.lot_id) {
        const lot = await tx.lotTracker.findUnique({ where: { id: salesLog.lot_id } });
        if (lot) {
          if (deltaQty > 0 && lot.available_qty < deltaQty) {
            throw new Error(`Insufficient stock in lot ${lot.lot_no}. Requested additional: ${deltaQty} kg, Available: ${lot.available_qty} kg`);
          }
          const newAvail = lot.available_qty - deltaQty;
          const newSold = Math.max(0, lot.sold_qty + deltaQty);
          const newStatus = newAvail <= 0 ? "Depleted" : "Active";

          await tx.lotTracker.update({
            where: { id: lot.id },
            data: {
              available_qty: newAvail,
              sold_qty: newSold,
              status: newStatus,
            }
          });
        }
      }

      if (salesLog.order_id) {
        const orderItem = await tx.orderItem.findFirst({
          where: {
            order_id: salesLog.order_id,
            product_id: salesLog.product_id,
          }
        });

        if (orderItem) {
          const newDelivered = Math.max(0, orderItem.delivered_qty + deltaQty);
          const newPending = Math.max(0, orderItem.pending_qty - deltaQty);
          await tx.orderItem.update({
            where: { id: orderItem.id },
            data: {
              delivered_qty: newDelivered,
              pending_qty: newPending,
            }
          });
        }
      }

      const oldUnitPrice = salesLog.unit_price || 0;
      const newUnitPrice = input.unit_price !== undefined ? Number(input.unit_price) : oldUnitPrice;
      const oldTotal = oldQty * oldUnitPrice;
      const newTotal = newQty * newUnitPrice;
      const deltaAmount = newTotal - oldTotal;

      if (salesLog.dealer_id && salesLog.transaction_type === "SALES" && deltaAmount !== 0) {
        const dealer = await tx.dealer.findUnique({ where: { id: salesLog.dealer_id } });
        if (dealer) {
          await tx.dealer.update({
            where: { id: salesLog.dealer_id },
            data: { current_balance: dealer.current_balance + deltaAmount }
          });
        }

        if (salesLog.invoice_id) {
          await tx.financialTransaction.updateMany({
            where: { reference_invoice: salesLog.invoice_id },
            data: { amount: newTotal }
          });
        }
      }

      return tx.salesLog.update({
        where: { id: input.id },
        data: {
          quantity: newQty,
          unit_price: newUnitPrice,
          ...(input.date ? { date: new Date(input.date) } : {}),
        }
      });
    });
  }

  /**
   * MASTER OVERRIDE: Update Stock Receive & Adjust Lot Inventory
   */
  static async updateStockReceive(org_id: string, input: { id: string; quantity: number; supplier_challan_no?: string; receive_date?: Date }) {
    return prisma.$transaction(async (tx) => {
      const receiveLog = await tx.receiveLog.findUnique({
        where: { id: input.id },
        include: { lot: true }
      });

      if (!receiveLog) throw new Error("Stock receive log record not found.");

      const oldQty = receiveLog.quantity;
      const newQty = Number(input.quantity);
      const deltaQty = newQty - oldQty;

      if (receiveLog.lot_id) {
        const lot = await tx.lotTracker.findUnique({ where: { id: receiveLog.lot_id } });
        if (lot) {
          const newInit = Math.max(0, lot.initial_qty + deltaQty);
          const newAvail = Math.max(0, lot.available_qty + deltaQty);
          const newStatus = newAvail <= 0 ? "Depleted" : "Active";

          await tx.lotTracker.update({
            where: { id: lot.id },
            data: {
              initial_qty: newInit,
              available_qty: newAvail,
              status: newStatus,
            }
          });
        }
      }

      return tx.receiveLog.update({
        where: { id: input.id },
        data: {
          quantity: newQty,
          ...(input.supplier_challan_no !== undefined ? { supplier_challan_no: input.supplier_challan_no } : {}),
          ...(input.receive_date ? { receive_date: new Date(input.receive_date) } : {}),
        }
      });
    });
  }

}
