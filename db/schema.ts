import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  pgEnum,
  uuid,
  numeric,
} from "drizzle-orm/pg-core";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const teamRoleEnum = pgEnum("team_role", ["leader", "admin", "member"]);
export const dbPermissionEnum = pgEnum("db_permission", ["f", "rw", "r"]); // f = full
export const formPermissionEnum = pgEnum("form_permission", ["f", "rw", "r"]);
export const logEntityEnum = pgEnum("log_entity", [
  "team",
  "team_member",
  "database",
  "db_col",
  "db_value",
  "form",
  "form_col",
  "form_submission",
  "date_trigger",
  "allotment",
]);
export const logActionEnum = pgEnum("log_action", [
  "created",
  "updated",
  "deleted",
  "shared",
  "permission_changed",
  "starred",
  "unstarred",
]);

// ─── Teams ────────────────────────────────────────────────────────────────────

export const teams = pgTable("teams", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon"),
  image: text("image"),
  createdBy: text("created_by").notNull(), // better-auth user id
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const teamMembers = pgTable("team_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  teamId: uuid("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(), // better-auth user id
  role: teamRoleEnum("role").notNull().default("member"),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

// ─── Databases ────────────────────────────────────────────────────────────────

export const databases = pgTable("databases", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon"),
  image: text("image"),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});


// NEW TABLE: Database Triggers
export const dbTriggers = pgTable("db_triggers", {
  id: uuid("id").primaryKey().defaultRandom(),
  dbId: uuid("db_id")
    .notNull()
    .references(() => databases.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // Trigger name
  description: text("description"),
  dateColumnId: uuid("date_column_id") // Column that stores the trigger date
    .references(() => dbCols.id, { onDelete: "set null" }),
  messageColumnId: uuid("message_column_id") // NEW: Column that stores the message to send
    .references(() => dbCols.id, { onDelete: "set null" }),
  message: text("message"), // Static message (if no column selected)
  isActive: boolean("is_active").default(true).notNull(),
  executed: boolean("executed").default(false).notNull(),
  executedAt: timestamp("executed_at"),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// NEW TABLE: Trigger Logs
export const triggerLogs = pgTable("trigger_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  triggerId: uuid("trigger_id")
    .notNull()
    .references(() => dbTriggers.id, { onDelete: "cascade" }),
  recordId: uuid("record_id")
    .notNull()
    .references(() => dbValues.id, { onDelete: "cascade" }),
  triggeredAt: timestamp("triggered_at").defaultNow().notNull(),
  status: text("status").notNull(), // success, failed, skipped
  message: text("message"), // Actual message that was sent
  error: text("error"),
});

// Update dbCols to include trigger settings
// Update dbCols table
export const dbCols = pgTable("db_cols", {
  id: uuid("id").primaryKey().defaultRandom(),
  dbId: uuid("db_id")
    .notNull()
    .references(() => databases.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  type: text("type").notNull().default("string"),
  bgColor: text("bg_color"),
  icon: text("icon"),
  order: integer("order").default(0),
  // NEW: For trigger type columns
  triggerDateColumnId: uuid("trigger_date_column_id").references((): any => dbCols.id, { onDelete: "set null" }),
  triggerMessageColumnId: uuid("trigger_message_column_id").references(():any => dbCols.id, { onDelete: "set null" }),
  triggerStaticMessage: text("trigger_static_message"),
});

// NEW TABLE: Trigger executions log
export const triggerExecutions = pgTable("trigger_executions", {
  id: uuid("id").primaryKey().defaultRandom(),
  dbId: uuid("db_id").notNull().references(() => databases.id, { onDelete: "cascade" }),
  triggerColumnId: uuid("trigger_column_id").notNull().references(() => dbCols.id, { onDelete: "cascade" }),
  recordId: uuid("record_id").notNull().references(() => dbValues.id, { onDelete: "cascade" }),
  executedAt: timestamp("executed_at").defaultNow().notNull(),
  status: text("status").notNull(), // 'pending', 'executed', 'failed'
  message: text("message"),
});

export const dbValues = pgTable("db_values", {
  id: uuid("id").primaryKey().defaultRandom(),
  dbId: uuid("db_id")
    .notNull()
    .references(() => databases.id, { onDelete: "cascade" }),
  values: jsonb("values").notNull(), // { [slug]: value }
  bgColor: text("bg_color"),
  starred: boolean("starred").default(false).notNull(),
  submittedBy: text("submitted_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userDbAllotments = pgTable("user_db_allotments", {
  id: uuid("id").primaryKey().defaultRandom(),
  dbId: uuid("db_id")
    .notNull()
    .references(() => databases.id, { onDelete: "cascade" }),
  userId: text("user_id"), // either userId or teamId required
  teamId: uuid("team_id").references(() => teams.id, { onDelete: "cascade" }),
  permission: dbPermissionEnum("permission").notNull().default("r"),
  icon: text("icon"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Forms ────────────────────────────────────────────────────────────────────

export const forms = pgTable("forms", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon"),
  image: text("image"),
  isPublic: boolean("is_public").default(false).notNull(),
  paid: boolean("paid").default(false).notNull(),
  payAmount: numeric("pay_amount", { precision: 10, scale: 2 }),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const formCols = pgTable("form_cols", {
  id: uuid("id").primaryKey().defaultRandom(),
  formId: uuid("form_id")
    .notNull()
    .references(() => forms.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  type: text("type").notNull().default("text"),
  options: jsonb("options"), // for radio, select, rating etc
  required: boolean("required").default(false).notNull(),
  bgColor: text("bg_color"),
  icon: text("icon"),
  order: integer("order").default(0),
});

export const formSubmissions = pgTable("form_submissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  formId: uuid("form_id")
    .notNull()
    .references(() => forms.id, { onDelete: "cascade" }),
  name: text("name"),
  email: text("email"),
  userId: text("user_id"), // optional — if logged-in user submitted
  values: jsonb("values").notNull(), // { [slug]: value }
  bgColor: text("bg_color"), // only admin/form owner can change
  starred: boolean("starred").default(false).notNull(),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
});

export const userFormAllotments = pgTable("user_form_allotments", {
  id: uuid("id").primaryKey().defaultRandom(),
  formId: uuid("form_id")
    .notNull()
    .references(() => forms.id, { onDelete: "cascade" }),
  userId: text("user_id"),
  teamId: uuid("team_id").references(() => teams.id, { onDelete: "cascade" }),
  permission: formPermissionEnum("permission").notNull().default("r"), // added — was missing
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Notifications ────────────────────────────────────────────────────────────

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  icon: text("icon"),
  url: text("url"),
  buttonText: text("button_text"),
  read: boolean("read").default(false).notNull(), // added — useful for unread badge
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Update Logs ──────────────────────────────────────────────────────────────

export const updateLogs = pgTable("update_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  entity: logEntityEnum("entity").notNull(),
  entityId: uuid("entity_id").notNull(),
  action: logActionEnum("action").notNull(),
  performedBy: text("performed_by").notNull(), // user id
  diff: jsonb("diff"), // { before: {...}, after: {...} } — optional snapshot
  meta: jsonb("meta"), // any extra context
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Payments (Razorpay) ──────────────────────────────────────────────────────

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  formId: uuid("form_id")
    .notNull()
    .references(() => forms.id, { onDelete: "cascade" }),
  submissionId: uuid("submission_id")
    .references(() => formSubmissions.id, { onDelete: "set null" }),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("INR"),
  razorpayOrderId: text("razorpay_order_id"),
  razorpayPaymentId: text("razorpay_payment_id"),
  razorpaySignature: text("razorpay_signature"),
  status: text("status").notNull().default("created"), // created | paid | failed
  name: text("name"),
  email: text("email"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// ─── Email Accounts ──────────────────────────────────────────────────────────

export const emailAccounts = pgTable("email_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  smtpHost: text("smtp_host").notNull(),
  smtpPort: integer("smtp_port").notNull().default(587),
  smtpUser: text("smtp_user").notNull(),
  smtpPass: text("smtp_pass").notNull(),
  useSSL: boolean("use_ssl").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const emailLogs = pgTable("email_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  accountId: uuid("account_id")
    .notNull()
    .references(() => emailAccounts.id, { onDelete: "cascade" }),
  fromEmail: text("from_email").notNull(),
  toEmail: text("to_email").notNull(),
  subject: text("subject").notNull(),
  body: text("body"),
  status: text("status").notNull(), // sent, failed
  error: text("error"),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
});

// ─── WhatsApp Accounts ────────────────────────────────────────────────────────

export const waAccounts = pgTable("wa_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  phone: text("phone"),
  status: text("status").notNull().default("disconnected"), // disconnected, connecting, connected
  sessionData: text("session_data"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Date Triggers ────────────────────────────────────────────────────────────

export const dateTriggers = pgTable("date_triggers", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id"), // either userId or teamId required
  teamId: uuid("team_id").references(() => teams.id, { onDelete: "cascade" }),
  dbColId: uuid("db_col_id").references(() => dbCols.id, { onDelete: "set null" }), // linked db column (trigger type)
  date: timestamp("date").notNull(),
  time: text("time"), // e.g. "14:30" — optional, if time-specific
  message: text("message").notNull(),
  icon: text("icon"),
  bgColor: text("bg_color"),
  fired: boolean("fired").default(false).notNull(), // track if trigger was already fired
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});