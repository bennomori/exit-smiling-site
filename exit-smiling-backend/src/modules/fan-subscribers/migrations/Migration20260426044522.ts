import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260426044522 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "fan_subscriber" ("id" text not null, "email" text not null, "email_normalized" text not null, "consent_given" boolean not null, "consent_text_version" text not null, "source" text not null, "status" text not null, "consent_at" timestamptz not null, "last_unlocked_at" timestamptz null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "fan_subscriber_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_fan_subscriber_deleted_at" ON "fan_subscriber" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "fan_subscriber" cascade;`);
  }

}
