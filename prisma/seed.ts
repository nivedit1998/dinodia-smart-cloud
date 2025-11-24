// Add to prisma/seed.ts
await prisma.user.create({
  data: {
    email: "tenant_living@example.com",
    name: "Living Room Tenant",
    role: "TENANT",
    householdMemberships: {
      create: {
        householdId: 1,       // Change to your household
        role: "TENANT",
        areaFilter: "Living Room", // EXACT HA Area Name
      }
    }
  }
});
