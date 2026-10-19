import {
  ALL_DEV_IDENTITIES,
  type DevIdentityKey,
} from "../lib/auth/dev-identities";

const target = process.argv[2]?.trim().toLowerCase();

console.log("=== CAS & IZU JOURNAL DEVELOPMENT IDENTITIES ===");

if (!target || target === "list") {
  console.log(
    "\nAvailable development identities for testing CAS journal workflows:\n",
  );
  for (const [key, identity] of Object.entries(ALL_DEV_IDENTITIES)) {
    const roles = [
      ...identity.globalRoles.map((r) => r.role),
      ...identity.journalRoles.map((r) => `${r.role} (${r.journalId})`),
    ].join(", ");

    console.log(`• ${key}:`);
    console.log(`    Name:  ${identity.displayName}`);
    console.log(`    Email: ${identity.email}`);
    console.log(`    Roles: ${roles || "None"}`);
    console.log(`    Scope: ${identity.description}`);
    console.log();
  }
  console.log(
    "To use in browser: Visit http://localhost:3001/login and click any test account button.",
  );
  console.log("Or set cookie: cas_dev_identity=<identity-key>\n");
  process.exit(0);
}

if (target in ALL_DEV_IDENTITIES) {
  const identity = ALL_DEV_IDENTITIES[target as DevIdentityKey];
  console.log(
    `\nSelected Identity: ${identity.displayName} (${identity.email})`,
  );
  console.log(`Cookie header: Cookie: cas_dev_identity=${target}`);
  console.log("\nCurl test command:");
  console.log(
    `curl -b "cas_dev_identity=${target}" http://localhost:3001/author`,
  );
  process.exit(0);
}

if (target === "clear") {
  console.log(
    "\nCleared dev identity cookie instruction: Set cookie cas_dev_identity=; Max-Age=0",
  );
  process.exit(0);
}

console.error(
  `\nUnknown identity: "${target}". Valid options: ${Object.keys(ALL_DEV_IDENTITIES).join(", ")}, list, clear`,
);
process.exit(1);
