import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // Create organization
  const org = await prisma.organization.upsert({
    where: { slug: "larson-financial" },
    update: {},
    create: {
      name: "Larson Financial Group",
      slug: "larson-financial",
      logoUrl: "https://www.larson.com/wp-content/uploads/larson-logo.svg",
      logoIconUrl: "https://www.larson.com/wp-content/uploads/Favicon.png",
      primaryColor: "#2E4E61",
      accentColor: "#F3C317",
      website: "https://www.larson.com",
      contactEmail: "events@larsonfinancial.com",
      timezone: "America/New_York",
      settings: {},
    },
  });

  console.log(`✅ Organization: ${org.name} (${org.id})`);

  // Create admin user
  const hashedPassword = await bcrypt.hash("admin123", 12);

  const admin = await prisma.adminUser.upsert({
    where: { email: "colin.wiens@larson.com" },
    update: {},
    create: {
      email: "colin.wiens@larson.com",
      hashedPassword,
      name: "Colin Wiens",
      role: "SUPER_ADMIN",
      organizationId: org.id,
    },
  });

  console.log(`✅ Admin user: ${admin.email} (password: admin123)`);

  // Create a sample event series
  const series = await prisma.eventSeries.create({
    data: {
      name: "Q1 2025 Tampa Bay Physician Dinners",
      description:
        "Quarterly dinner series for Tampa Bay area physicians focusing on financial planning strategies.",
      eventType: "IN_PRACTICE",
      organizationId: org.id,
    },
  });

  console.log(`✅ Event series: ${series.name}`);

  // Create a sample event
  const eventDate = new Date("2025-03-15T23:00:00.000Z"); // 6 PM ET
  const event = await prisma.event.create({
    data: {
      name: "Physician Financial Planning Dinner",
      eventType: "IN_PRACTICE",
      status: "DRAFT",
      date: eventDate,
      startTime: eventDate,
      endTime: new Date("2025-03-16T01:00:00.000Z"), // 8 PM ET
      venueName: "Fleming's Prime Steakhouse",
      venueAddress: "4322 W Boy Scout Blvd",
      venueCity: "Tampa",
      venueState: "FL",
      venueZip: "33607",
      publicCapacity: 20,
      privateCapacity: 24,
      waitlistEnabled: true,
      description:
        "Join a small group of physicians for a relaxed evening focused on the financial issues that hit physicians the hardest. No sales pitch. No slides. Just good food and practical conversation.",
      invitationHeadline: "An evening of dinner, conversation, and practical financial strategy",
      hostName: "Colin Wiens, CFP® MBA",
      hostBio:
        "I've spent the last 15 years working exclusively with Central Florida physicians on tax planning, investments, and building long-term wealth. I look forward to meeting you over dinner.",
      organizationId: org.id,
      seriesId: series.id,
    },
  });

  console.log(`✅ Sample event: ${event.name} (${event.id})`);

  // Create a sample template
  const template = await prisma.eventTemplate.create({
    data: {
      name: "Standard IP Dinner - 20 seats",
      eventType: "IN_PRACTICE",
      defaultName: "Physician Financial Planning Dinner",
      descriptionTemplate:
        "Join a small group of physicians for a relaxed evening focused on the financial issues that hit physicians the hardest. No sales pitch. No slides. Just good food and practical conversation.",
      invitationHeadline: "An evening of dinner, conversation, and practical financial strategy",
      publicCapacity: 20,
      privateCapacity: 24,
      waitlistEnabled: true,
      hostName: "Colin Wiens, CFP® MBA",
      hostBio:
        "I've spent the last 15 years working exclusively with Central Florida physicians on tax planning, investments, and building long-term wealth. I look forward to meeting you over dinner.",
      organizationId: org.id,
    },
  });

  console.log(`✅ Template: ${template.name}`);

  // Create sample invitees
  const invitees = await Promise.all([
    prisma.invitee.create({
      data: {
        firstName: "Sarah",
        lastName: "Chen",
        email: "sarah.chen@example.com",
        phone: "(863) 555-1234",
        title: "Dr.",
        credentials: "MD, FACC",
        specialty: "Cardiology",
        practiceName: "Lakeland Regional Health",
        inviteeType: "IN_PRACTICE",
        source: "seed",
        organizationId: org.id,
      },
    }),
    prisma.invitee.create({
      data: {
        firstName: "James",
        lastName: "Rivera",
        email: "james.rivera@example.com",
        phone: "(863) 555-5678",
        title: "Dr.",
        credentials: "DO",
        specialty: "Family Practice",
        practiceName: "Rivera Family Medicine",
        inviteeType: "IN_PRACTICE",
        source: "seed",
        organizationId: org.id,
      },
    }),
    prisma.invitee.create({
      data: {
        firstName: "Maria",
        lastName: "Santos",
        email: "maria.santos@example.com",
        phone: "(813) 555-9012",
        title: "Dr.",
        credentials: "MD",
        specialty: "Internal Medicine",
        practiceName: "Tampa Bay Internal Medicine",
        inviteeType: "IN_PRACTICE",
        source: "seed",
        organizationId: org.id,
      },
    }),
  ]);

  console.log(`✅ Created ${invitees.length} sample invitees`);

  // Create invitations for the event
  for (const invitee of invitees) {
    const invitation = await prisma.invitation.create({
      data: {
        eventId: event.id,
        inviteeId: invitee.id,
      },
    });
    console.log(
      `✅ Invitation for ${invitee.firstName} ${invitee.lastName}: /rsvp/${invitation.token}`
    );
  }

  console.log("\n🎉 Seeding complete!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
