import { CreateRestaurant } from "wasp/server/operations";

export const createRestaurant: CreateRestaurant<
  {
    name: string;
    slug: string;
    phone: string;
    address: string;
    description?: string;
  },
  any
> = async (args, context) => {
  if (!context.user) {
    throw new Error("Unauthorized");
  }

  // Check if user already has a restaurant
  const existingRestaurant = await context.entities.Restaurant.findFirst({
    where: { userId: context.user.id },
  });

  if (existingRestaurant) {
    throw new Error("User already has a restaurant");
  }

  // Check slug uniqueness
  const restaurantWithSlug = await context.entities.Restaurant.findFirst({
    where: { slug: args.slug },
  });

  if (restaurantWithSlug) {
    throw new Error("This slug is already taken");
  }

  return context.entities.Restaurant.create({
    data: {
      name: args.name,
      slug: args.slug,
      phone: args.phone,
      address: args.address,
      description: args.description,
      status: "PENDING",
      user: { connect: { id: context.user.id } },
    },
  });
};

export const getOrderDetails = async (args: { orderId: string; slug: string }, context: any) => {
  const order = await context.entities.Order.findUnique({
    where: { id: args.orderId },
    include: {
      restaurant: true,
      orderItems: {
        include: {
          menuItem: true,
          addOns: {
            include: {
              addOn: true,
            },
          },
        },
      },
    },
  });

  if (!order || order.restaurant.slug !== args.slug) {
    throw new Error("Order not found or access denied.");
  }

  return order;
};

export const getRestaurantOrders = async (args: { status?: string }, context: any) => {
  if (!context.user) throw new Error("Unauthorized");
  const restaurant = await context.entities.Restaurant.findUnique({
    where: { userId: context.user.id },
  });
  if (!restaurant) throw new Error("Restaurant not found");

  return context.entities.Order.findMany({
    where: {
      restaurantId: restaurant.id,
      status: args.status ? (args.status as any) : undefined,
    },
    include: {
      orderItems: {
        include: {
          menuItem: true,
          addOns: { include: { addOn: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

export const updateOrderStatus = async (
  args: { orderId: string; status: string },
  context: any
) => {
  if (!context.user) throw new Error("Unauthorized");
  // Security check: ensure order belongs to user's restaurant
  const order = await context.entities.Order.findUnique({
    where: { id: args.orderId },
    include: { restaurant: true },
  });
  if (!order || order.restaurant.userId !== context.user.id) {
    throw new Error("Access denied");
  }

  return context.entities.Order.update({
    where: { id: args.orderId },
    data: { status: args.status as any },
  });
};

export const updateOrderPaymentStatus = async (
  args: { orderId: string; paymentStatus: string },
  context: any
) => {
  if (!context.user) throw new Error("Unauthorized");
  const order = await context.entities.Order.findUnique({
    where: { id: args.orderId },
    include: { restaurant: true },
  });
  if (!order || order.restaurant.userId !== context.user.id) {
    throw new Error("Access denied");
  }

  return context.entities.Order.update({
    where: { id: args.orderId },
    data: { paymentStatus: args.paymentStatus as any },
  });
};

export const getDashboardStats = async (_args: any, context: any) => {
  if (!context.user) throw new Error("Unauthorized");
  const restaurant = await context.entities.Restaurant.findUnique({
    where: { userId: context.user.id },
  });
  if (!restaurant) throw new Error("Restaurant not found");

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [ordersToday, revenueToday, pendingCount, menuItemsCount] = await Promise.all([
    context.entities.Order.count({
      where: { restaurantId: restaurant.id, createdAt: { gte: todayStart } },
    }),
    context.entities.Order.aggregate({
      where: {
        restaurantId: restaurant.id,
        createdAt: { gte: todayStart },
        status: { not: "CANCELLED" },
      },
      _sum: { total: true },
    }),
    context.entities.Order.count({
      where: { restaurantId: restaurant.id, status: { in: ["PENDING", "ACCEPTED", "PREPARING"] } },
    }),
    context.entities.MenuItem.count({
      where: { restaurantId: restaurant.id },
    }),
  ]);

  return {
    ordersToday,
    revenueToday: revenueToday._sum.total || 0,
    pendingCount,
    menuItemsCount,
  };
};

export const updateRestaurantSettings = async (args: any, context: any) => {
  if (!context.user) throw new Error("Unauthorized");
  const restaurant = await context.entities.Restaurant.findUnique({
    where: { userId: context.user.id },
  });
  if (!restaurant) throw new Error("Restaurant not found");

  const { id, ...data } = args;
  return context.entities.Restaurant.update({
    where: { id: restaurant.id },
    data,
  });
};

export const getReportData = async (args: { startDate: string; endDate: string }, context: any) => {
  if (!context.user) throw new Error("Unauthorized");
  const restaurant = await context.entities.Restaurant.findUnique({
    where: { userId: context.user.id },
  });
  if (!restaurant) throw new Error("Restaurant not found");

  const start = new Date(args.startDate);
  const end = new Date(args.endDate);
  end.setHours(23, 59, 59, 999);

  const [orders, topItems] = await Promise.all([
    context.entities.Order.findMany({
      where: {
        restaurantId: restaurant.id,
        createdAt: { gte: start, lte: end },
      },
    }),
    context.entities.OrderItem.groupBy({
      by: ["menuItemId"],
      where: {
        restaurantId: restaurant.id,
        order: { createdAt: { gte: start, lte: end } },
      },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
  ]);

  // Fetch names for top items
  const topItemsWithDetails = await Promise.all(
    topItems.map(async (item) => {
      const details = await context.entities.MenuItem.findUnique({
        where: { id: item.menuItemId },
        select: { name: true },
      });
      return { name: details?.name || "Unknown", quantity: item._sum.quantity || 0 };
    })
  );

  return {
    orders,
    topItems: topItemsWithDetails,
  };
};

export const findOrderByPhone = async (args: { phone: string; slug: string }, context: any) => {
  const restaurant = await context.entities.Restaurant.findUnique({
    where: { slug: args.slug },
  });

  if (!restaurant) throw new Error("Restaurant not found.");

  return context.entities.Order.findFirst({
    where: {
      phone: args.phone,
      restaurantId: restaurant.id,
    },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
};

export const createOrder = async (
  args: {
    restaurantSlug: string;
    customerName: string;
    phone: string;
    orderType: "DINE_IN" | "TAKEAWAY" | "DELIVERY";
    tableNumber?: string;
    address?: string;
    paymentMethod: "CASH_ON_COUNTER" | "PAY_AT_RESTAURANT" | "CASH_ON_DELIVERY" | "BANK_TRANSFER" | "JAZZCASH" | "EASYPAISA";
    items: {
      menuItemId: string;
      quantity: number;
      selectedAddOnIds: string[];
      instructions?: string;
    }[];
  },
  context: any
) => {
  const restaurant = await context.entities.Restaurant.findUnique({
    where: { slug: args.restaurantSlug },
    include: {
      menuItems: {
        include: {
          addOns: {
            include: {
              addOn: true,
            },
          },
        },
      },
    },
  });

  if (!restaurant || restaurant.status !== "APPROVED") {
    throw new Error("Restaurant is not available for orders.");
  }

  // Calculate total and validate items server-side
  let orderTotal = 0;
  const orderItemsData = [];

  for (const cartItem of args.items) {
    const menuItem = restaurant.menuItems.find((mi: any) => mi.id === cartItem.menuItemId);
    if (!menuItem || !menuItem.isAvailable) {
      throw new Error(`Item ${cartItem.menuItemId} is no longer available.`);
    }

    let itemSubtotal = menuItem.price;
    const itemAddOns = [];

    for (const addOnId of cartItem.selectedAddOnIds) {
      const addOnLink = menuItem.addOns.find((ao: any) => ao.addOnId === addOnId);
      if (!addOnLink) {
        throw new Error(`Add-on ${addOnId} is not available for item ${menuItem.name}.`);
      }
      itemSubtotal += addOnLink.addOn.price;
      itemAddOns.push({
        addOn: { connect: { id: addOnId } },
        restaurant: { connect: { id: restaurant.id } },
      });
    }

    orderTotal += itemSubtotal * cartItem.quantity;
    orderItemsData.push({
      menuItem: { connect: { id: menuItem.id } },
      restaurant: { connect: { id: restaurant.id } },
      quantity: cartItem.quantity,
      price: menuItem.price, // Store price at time of order
      instructions: cartItem.instructions,
      addOns: {
        create: itemAddOns,
      },
    });
  }

  // Create order in database
  return context.entities.Order.create({
    data: {
      restaurant: { connect: { id: restaurant.id } },
      customerName: args.customerName,
      phone: args.phone,
      orderType: args.orderType,
      tableNumber: args.tableNumber,
      address: args.address,
      paymentMethod: args.paymentMethod,
      total: orderTotal,
      orderItems: {
        create: orderItemsData,
      },
    },
  });
};

export const getRestaurantBySlug = async (args: { slug: string }, context: any) => {
  const restaurant = await context.entities.Restaurant.findUnique({
    where: { slug: args.slug },
    include: {
      categories: {
        orderBy: { displayOrder: "asc" },
        include: {
          menuItems: {
            where: { isAvailable: true },
            include: {
              addOns: {
                include: {
                  addOn: true,
                },
              },
            },
          },
        },
      },
      addOns: true,
    },
  });

  if (restaurant && restaurant.status !== "APPROVED") {
    return null; // Don't show menu for unapproved/suspended restaurants
  }

  return restaurant;
};

export const getMyRestaurant = async (_args: any, context: any) => {
  if (!context.user) {
    throw new Error("Unauthorized");
  }
  return context.entities.Restaurant.findUnique({
    where: { userId: context.user.id },
  });
};

export const getRestaurantsByStatus = async (args: { status?: string }, context: any) => {
  if (!context.user || !context.user.isAdmin) {
    throw new Error("Unauthorized");
  }
  return context.entities.Restaurant.findMany({
    where: args.status ? { status: args.status } : {},
    include: {
      user: {
        select: {
          id: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

export const updateRestaurantStatus = async (
  args: { id: string; status: "APPROVED" | "REJECTED" | "SUSPENDED"; statusDetails?: string },
  context: any
) => {
  if (!context.user || !context.user.isAdmin) {
    throw new Error("Unauthorized");
  }

  const updatedRestaurant = await context.entities.Restaurant.update({
    where: { id: args.id },
    data: {
      status: args.status,
      statusDetails: args.statusDetails,
    },
    include: {
      user: {
        select: {
          email: true,
        },
      },
    },
  });

  if (updatedRestaurant.user.email) {
    try {
      const { getApprovalEmail, getRejectionEmail } = await import("./emails");
      let emailContent;
      if (args.status === "APPROVED") {
        emailContent = getApprovalEmail(updatedRestaurant.name);
      } else if (args.status === "REJECTED") {
        emailContent = getRejectionEmail(updatedRestaurant.name, args.statusDetails || "No reason provided.");
      }

      if (emailContent) {
        await context.emailSender.send({
          to: updatedRestaurant.user.email,
          ...emailContent,
        });
      }
    } catch (error) {
      console.error("Failed to send status update email:", error);
    }
  }

  return updatedRestaurant;
};

// --- Categories ---

export const getCategories = async (_args: any, context: any) => {
  if (!context.user) throw new Error("Unauthorized");
  const restaurant = await context.entities.Restaurant.findUnique({
    where: { userId: context.user.id },
  });
  if (!restaurant) throw new Error("Restaurant not found");

  return context.entities.MenuCategory.findMany({
    where: { restaurantId: restaurant.id },
    orderBy: { displayOrder: "asc" },
    include: {
      menuItems: {
        include: {
          addOns: {
            include: {
              addOn: true,
            },
          },
        },
      },
    },
  });
};

export const createCategory = async (args: { name: string; displayOrder?: number }, context: any) => {
  if (!context.user) throw new Error("Unauthorized");
  const restaurant = await context.entities.Restaurant.findUnique({
    where: { userId: context.user.id },
  });
  if (!restaurant) throw new Error("Restaurant not found");

  return context.entities.MenuCategory.create({
    data: {
      name: args.name,
      displayOrder: args.displayOrder || 0,
      restaurant: { connect: { id: restaurant.id } },
    },
  });
};

export const updateCategory = async (args: { id: string; name?: string; displayOrder?: number }, context: any) => {
  if (!context.user) throw new Error("Unauthorized");

  const existingCategory = await context.entities.MenuCategory.findUnique({
    where: { id: args.id },
  });
  if (!existingCategory) throw new Error("Category not found");

  if (args.displayOrder !== undefined && args.displayOrder !== existingCategory.displayOrder) {
    // Basic reordering: shift others
    const isMovingUp = args.displayOrder < existingCategory.displayOrder;
    await context.entities.MenuCategory.updateMany({
      where: {
        restaurantId: existingCategory.restaurantId,
        displayOrder: isMovingUp
          ? { gte: args.displayOrder, lt: existingCategory.displayOrder }
          : { gt: existingCategory.displayOrder, lte: args.displayOrder },
      },
      data: {
        displayOrder: isMovingUp ? { increment: 1 } : { decrement: 1 },
      },
    });
  }

  const data: any = {};
  if (args.name !== undefined) data.name = args.name;
  if (args.displayOrder !== undefined) data.displayOrder = args.displayOrder;

  return context.entities.MenuCategory.update({
    where: { id: args.id },
    data,
  });
};

export const deleteCategory = async (args: { id: string }, context: any) => {
  if (!context.user) throw new Error("Unauthorized");
  return context.entities.MenuCategory.delete({
    where: { id: args.id },
  });
};

export const linkAddOnToMenuItem = async (args: { menuItemId: string; addOnId: string }, context: any) => {
  if (!context.user) throw new Error("Unauthorized");
  return context.entities.MenuItemAddOn.create({
    data: {
      menuItem: { connect: { id: args.menuItemId } },
      addOn: { connect: { id: args.addOnId } },
    },
  });
};

export const unlinkAddOnFromMenuItem = async (args: { menuItemId: string; addOnId: string }, context: any) => {
  if (!context.user) throw new Error("Unauthorized");
  return context.entities.MenuItemAddOn.delete({
    where: {
      menuItemId_addOnId: {
        menuItemId: args.menuItemId,
        addOnId: args.addOnId,
      },
    },
  });
};

// --- Menu Items ---

export const createMenuItem = async (
  args: {
    name: string;
    description?: string;
    price: number;
    categoryId: string;
    image?: string;
    isAvailable?: boolean;
  },
  context: any
) => {
  if (!context.user) throw new Error("Unauthorized");
  const restaurant = await context.entities.Restaurant.findUnique({
    where: { userId: context.user.id },
  });
  if (!restaurant) throw new Error("Restaurant not found");

  return context.entities.MenuItem.create({
    data: {
      name: args.name,
      description: args.description,
      price: args.price,
      image: args.image,
      isAvailable: args.isAvailable ?? true,
      category: { connect: { id: args.categoryId } },
      restaurant: { connect: { id: restaurant.id } },
    },
  });
};

export const updateMenuItem = async (
  args: {
    id: string;
    name?: string;
    description?: string;
    price?: number;
    image?: string;
    isAvailable?: boolean;
    categoryId?: string;
  },
  context: any
) => {
  if (!context.user) throw new Error("Unauthorized");
  const data: any = { ...args };
  delete data.id;
  if (args.categoryId) {
    data.category = { connect: { id: args.categoryId } };
    delete data.categoryId;
  }

  return context.entities.MenuItem.update({
    where: { id: args.id },
    data,
  });
};

export const deleteMenuItem = async (args: { id: string }, context: any) => {
  if (!context.user) throw new Error("Unauthorized");
  return context.entities.MenuItem.delete({
    where: { id: args.id },
  });
};

// --- Add-Ons ---

export const getAddOnsByMenuItem = async (args: { menuItemId: string }, context: any) => {
  if (!context.user) throw new Error("Unauthorized");
  return context.entities.AddOn.findMany({
    where: {
      restaurant: { user: { id: context.user.id } },
      // Note: AddOn schema doesn't directly link to MenuItem, let's fix that or manage differently
      // Based on schema, AddOn belongs to Restaurant.
    },
  });
};

// Re-thinking: AddOn is scoped to Restaurant in Task 1. We need a way to link it to MenuItem
// for many-to-many. Let's add a join model in the next step or adjust.
// For now, let's allow managing AddOns at the restaurant level as a global list.
export const getRestaurantAddOns = async (_args: any, context: any) => {
  if (!context.user) throw new Error("Unauthorized");
  const restaurant = await context.entities.Restaurant.findUnique({
    where: { userId: context.user.id },
  });
  if (!restaurant) throw new Error("Restaurant not found");

  return context.entities.AddOn.findMany({
    where: { restaurantId: restaurant.id },
  });
};

export const createAddOn = async (args: { name: string; price: number }, context: any) => {
  if (!context.user) throw new Error("Unauthorized");
  const restaurant = await context.entities.Restaurant.findUnique({
    where: { userId: context.user.id },
  });
  if (!restaurant) throw new Error("Restaurant not found");

  return context.entities.AddOn.create({
    data: {
      name: args.name,
      price: args.price,
      restaurant: { connect: { id: restaurant.id } },
    },
  });
};

export const deleteAddOn = async (args: { id: string }, context: any) => {
  if (!context.user) throw new Error("Unauthorized");
  return context.entities.AddOn.delete({
    where: { id: args.id },
  });
};
