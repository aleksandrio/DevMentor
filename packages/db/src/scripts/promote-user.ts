// Grants the admin role: `npm run db:user:promote -- --email <e-mail>`.
// The only way to create an admin; there is deliberately no HTTP endpoint.
import { parseArgs } from "node:util";
import { MikroORM } from "@mikro-orm/postgresql";
import { User } from "../entities/auth/user.entity";
import config from "../mikro-orm.config";

const { values } = parseArgs({ options: { email: { type: "string" } } });
const email = values.email?.trim().toLowerCase();
if (!email) {
  console.error("Usage: npm run db:user:promote -- --email <e-mail>");
  process.exit(1);
}

const orm = await MikroORM.init(config);
try {
  const em = orm.em.fork();
  const user = await em.findOne(User, { email });
  if (!user) {
    console.error(`No user with e-mail ${email}.`);
    process.exitCode = 1;
  } else {
    user.role = "admin";
    await em.flush();
    console.log(`${email} is now an admin.`);
  }
} finally {
  await orm.close();
}
