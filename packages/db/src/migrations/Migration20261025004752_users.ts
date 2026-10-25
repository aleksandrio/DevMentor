import { Migration } from '@mikro-orm/migrations';

export class Migration20261025004752_users extends Migration {

  override name = 'Migration20261025004752_users';

  override up(): void | Promise<void> {
    this.addSql(`create table "users" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "email" varchar(254) not null, "password_hash" varchar(255) not null, "display_name" varchar(100) not null, "role" text not null default 'student', primary key ("id"));`);
    this.addSql(`alter table "users" add constraint "users_email_unique" unique ("email");`);

    this.addSql(`alter table "users" add constraint "users_role_check" check ("role" in ('student', 'mentor', 'admin'));`);
  }

  override down(): void | Promise<void> {
    this.addSql(`drop table if exists "users" cascade;`);
  }

}
