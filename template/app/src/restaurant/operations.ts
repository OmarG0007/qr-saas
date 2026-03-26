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

export const getRestaurantBySlug = async (args: { slug: string }, context: any) => {
  return context.entities.Restaurant.findUnique({
    where: { slug: args.slug },
    include: {
      categories: {
        include: {
          menuItems: true,
        },
      },
      addOns: true,
    },
  });
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
