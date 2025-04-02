const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(12);
  return await bcrypt.hash(password, salt);
}

async function main() {
  console.log("🚀 Starting database seeding...");

  try {
    // Clear existing data (order matters due to foreign keys)
    await prisma.Appointment.deleteMany().catch(() => console.log("No appointments to delete"));
    await prisma.User.deleteMany().catch(() => console.log("No users to delete"));

    // Create Admin
    const admin = await prisma.User.create({
      data: {
        name: "Muuo Alex",
        email: "muuoalex136@gmail.com",
        password: await hashPassword("Muuo@2025"),
        role: "ADMIN",
        gender: "MALE",
        nationalId: "12345678",
        available: true
      }
    });

    // Doctor data
    const doctors = [
      { name: "John Anderson", email: "johnanderson@gmail.com", password: "Anderson@2025", nationalId: "22345678", gender: "MALE" },
      { name: "Mitchelle Harris", email: "mitchelleharris@gmail.com", password: "Harris@2025", nationalId: "32345678", gender: "FEMALE" }
    ];

    // Create Doctors
    const createdDoctors = await Promise.all(
      doctors.map(async (doc) => {
        return await prisma.User.create({
          data: {
            ...doc,
            password: await hashPassword(doc.password),
            role: "DOCTOR",
            available: true
          }
        });
      })
    );

    // Patient data
    const patients = [
      { name: "Alice Turner", email: "aliceturner@gmail.com", password: "Turner@2025", nationalId: "72345678", gender: "FEMALE" }
    ];

    // Create Patients
    const createdPatients = await prisma.User.createMany({
      data: await Promise.all(
        patients.map(async (pat) => ({
          ...pat,
          password: await hashPassword(pat.password),
          role: "PATIENT",
          available: false
        }))
      )
    });

    console.log("✅ Seeding completed successfully!");
    console.log(`
    ========= SUMMARY ========
    Admin:   ${admin.email}
    Doctors: ${createdDoctors.length}
    Patients: ${createdPatients.count}
    ===========================
    `);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Execute with error handling
main().catch((e) => {
  console.error("Fatal error during seeding:", e);
  process.exit(1);
});