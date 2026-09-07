import "dotenv/config";
import { prisma } from "./config/database.js";
import { hashPassword } from "./utils/password.js";

const adminPermissions = [
  {
    code: "users.read",
    name: "View users",
    module: "users",
  },
  {
    code: "users.create",
    name: "Create users",
    module: "users",
  },
  {
    code: "users.update",
    name: "Update users",
    module: "users",
  },
  {
    code: "roles.manage",
    name: "Manage roles and permissions",
    module: "roles",
  },
  {
    code: "audit.read",
    name: "View audit logs",
    module: "audit",
  },
];

function requiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not configured`);
  }

  return value;
}

async function main(): Promise<void> {
  const role = await prisma.role.upsert({
    where: { code: "ADMIN" },
    update: {
      name: "Administrator",
      description: "Full ERP system administrator",
      isSystem: true,
    },
    create: {
      code: "ADMIN",
      name: "Administrator",
      description: "Full ERP system administrator",
      isSystem: true,
    },
  });

  for (const permissionData of adminPermissions) {
    const permission = await prisma.permission.upsert({
      where: { code: permissionData.code },
      update: {
        name: permissionData.name,
        module: permissionData.module,
      },
      create: permissionData,
    });

    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: role.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: role.id,
        permissionId: permission.id,
      },
    });
  }

  const email = requiredEnv("ADMIN_EMAIL").trim().toLowerCase();
  const passwordHash = await hashPassword(requiredEnv("ADMIN_PASSWORD"));

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      employeeCode: requiredEnv("ADMIN_EMPLOYEE_CODE"),
      firstName: requiredEnv("ADMIN_FIRST_NAME"),
      lastName: requiredEnv("ADMIN_LAST_NAME"),
      passwordHash,
    },
    create: {
      employeeCode: requiredEnv("ADMIN_EMPLOYEE_CODE"),
      firstName: requiredEnv("ADMIN_FIRST_NAME"),
      lastName: requiredEnv("ADMIN_LAST_NAME"),
      email,
      passwordHash,
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: admin.id,
        roleId: role.id,
      },
    },
    update: {},
    create: {
      userId: admin.id,
      roleId: role.id,
    },
  });

  console.log("Administrator account and permissions created successfully.");
}

main()
  .catch((error: unknown) => {
    console.error("Database seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });