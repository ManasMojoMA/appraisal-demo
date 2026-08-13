const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { employeeCode: 'GUGSOB202534690' }
  });
  console.log("Users with employee code GUGSOB202534690:");
  console.log(users);

  const allUsers = await prisma.user.findMany();
  console.log("Total users:", allUsers.length);
  console.log(allUsers.map(u => `${u.name} - ${u.email} - ${u.employeeCode}`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
