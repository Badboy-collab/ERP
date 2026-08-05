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
  date?: Date;
  items: InvoiceItemInput[];
}

export interface CreateReceiveInput {
  depot_id: string;
  invoice_no: string;
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
  static async getNextDONumber() {
    const today = new Date();
    const yy = String(today.getFullYear()).slice(-2);
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const prefix = `${yy}${mm}${dd}`;

    const lastDO = await prisma.deliveryOrder.findFirst({
      where: { order_no: { startsWith: prefix } },
      orderBy: { order_no: 'desc' }
    });

    if (lastDO) {
      const lastSeq = parseInt(lastDO.order_no.slice(-3), 10);
      const nextSeq = String(lastSeq + 1).padStart(3, '0');
      return `${prefix}${nextSeq}`;
    }

    return `${prefix}001`;
  }

  /**
   * Record Stock Receive
   * All quantities are in Kg.
   */
  static async recordStockReceive(input: CreateReceiveInput) {
    if (input.quantity <= 0) {
      throw new Error("Received quantity must be greater than 0.");
    }

    return prisma.$transaction(async (tx) => {
      let lot = await tx.lotTracker.findFirst({
        where: {
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
          depot_id: input.depot_id,
          invoice_no: input.invoice_no,
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
  static async recordInvoiceTransaction(input: CreateInvoiceTransactionInput) {
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
          depot_id: input.depot_id,
          invoice_no: input.invoice_no,
          transaction_type: input.transaction_type,
          date: txDate,
          dealer_id: input.dealer_id || null,
          order_id: input.order_id || null,
          destination: input.destination || null,
          notes: input.notes || null,
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
  static async suggestFIFOLot(product_id: string, depot_id?: string) {
    return prisma.lotTracker.findFirst({
      where: {
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
  static async getDeliveryOrderForAutoPopulate(order_id: string) {
    const order = await prisma.deliveryOrder.findUnique({
      where: { id: order_id },
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
        const fifoLot = await ERPService.suggestFIFOLot(item.product_id, order.depot_id);
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
  static async createDeliveryOrder(input: CreateOrderInput) {
    const final_order_no = input.order_no || await ERPService.getNextDONumber();

    return prisma.deliveryOrder.create({
      data: {
        depot_id: input.depot_id,
        dealer_id: input.dealer_id,
        order_no: final_order_no,
        order_date: input.order_date ? new Date(input.order_date) : new Date(),
        status: "Pending",
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

  /**
   * Real-Time Stock Display
   */
  static async getRealtimeStockReport(depot_id?: string) {
    const products = await prisma.product.findMany({
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    const depotFilter = depot_id ? { depot_id } : {};

    return Promise.all(
      products.map(async (prod) => {
        const bagSize = prod.bag_size_kg || 50.0;

        const rxAgg = await prisma.receiveLog.aggregate({
          where: { product_id: prod.id, ...depotFilter },
          _sum: { quantity: true },
        });

        const salesAgg = await prisma.salesLog.aggregate({
          where: {
            product_id: prod.id,
            transaction_type: { in: ["SALES", "DELIVERY"] },
            ...depotFilter,
          },
          _sum: { quantity: true },
        });

        const returnAgg = await prisma.salesLog.aggregate({
          where: {
            product_id: prod.id,
            transaction_type: "FACTORY_RETURN",
            ...depotFilter,
          },
          _sum: { quantity: true },
        });

        const openingKg = prod.opening_stock || 0;
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
  static async getDetailedExpiryReport(depot_id?: string) {
    const activeLots = await prisma.lotTracker.findMany({
      where: {
        available_qty: { gt: 0 },
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
  static async getLotReconciliation(depot_id?: string) {
    const products = await prisma.product.findMany();

    return Promise.all(
      products.map(async (prod) => {
        const depotFilter = depot_id ? { depot_id } : {};

        const lotAgg = await prisma.lotTracker.aggregate({
          where: { product_id: prod.id, ...depotFilter },
          _sum: { available_qty: true },
        });
        const totalLotAvailable = lotAgg._sum.available_qty || 0;

        const rxAgg = await prisma.receiveLog.aggregate({
          where: { product_id: prod.id, ...depotFilter },
          _sum: { quantity: true },
        });
        const salesAgg = await prisma.salesLog.aggregate({
          where: { product_id: prod.id, transaction_type: { in: ["SALES", "DELIVERY"] }, ...depotFilter },
          _sum: { quantity: true },
        });
        const retAgg = await prisma.salesLog.aggregate({
          where: { product_id: prod.id, transaction_type: "FACTORY_RETURN", ...depotFilter },
          _sum: { quantity: true },
        });
        const trfAgg = await prisma.salesLog.aggregate({
          where: { product_id: prod.id, transaction_type: "TRANSFER_OUT", ...depotFilter },
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
  static async getDealerLedger(dealer_id: string) {
    const transactions = await prisma.financialTransaction.findMany({
      where: { dealer_id },
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
  static async getDepotFinancialSummary(depot_id?: string) {
    const filter = depot_id ? { depot_id } : {};
    
    const debitsAgg = await prisma.financialTransaction.aggregate({
      where: { ...filter, type: 'DEBIT' },
      _sum: { amount: true }
    });
    
    const creditsAgg = await prisma.financialTransaction.aggregate({
      where: { ...filter, type: 'CREDIT' },
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
  static async recordPayment(input: PaymentInput) {
    return prisma.$transaction(async (tx) => {
      const txDate = input.date ? new Date(input.date) : new Date();

      const transaction = await tx.financialTransaction.create({
        data: {
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
}
