"use server"

import { db } from "@/db"
import {
  users,
  licenses,
  domains,
  payments,
  orders,
  auditLogs,
  plans,
  webhookEvents,
} from "@/db/schema"
import { eq, and, isNull, desc, ilike, sql, count, or } from "drizzle-orm"
import { getAppSession } from "@/lib/auth-session"
import { enqueueEmailJob, enqueueLicenseMetadataExportJob } from "@/lib/queue"
import { createAuditLog } from "@/lib/audit"
import { revalidatePath } from "next/cache"

async function requireAdmin() {
  const session = await getAppSession()
  if (!session || session.role !== "admin") {
    throw new Error("Forbidden")
  }
  return session
}

export async function adminGetUsers(page = 1, search = "", pageSize = 10) {
  await requireAdmin()

  const offset = (page - 1) * pageSize
  const whereClause = search
    ? or(
        ilike(users.email, `%${search}%`),
        ilike(users.name, `%${search}%`),
        ilike(users.role, `%${search}%`),
        sql`to_char(${users.createdAt}, 'Mon DD, YYYY HH24:MI') ilike ${`%${search}%`}`
      )
    : undefined

  const [data, total] = await Promise.all([
    db
      .select()
      .from(users)
      .where(whereClause)
      .orderBy(desc(users.createdAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ value: count() }).from(users).where(whereClause),
  ])

  return {
    data,
    total: total[0]?.value || 0,
    page,
    pageSize,
    totalPages: Math.ceil((total[0]?.value || 0) / pageSize),
  }
}

export async function adminGetPayments(page = 1, search = "", pageSize = 10) {
  await requireAdmin()

  const offset = (page - 1) * pageSize
  const whereClause = search
    ? or(
        ilike(payments.stripeSessionId, `%${search}%`),
        ilike(payments.status, `%${search}%`),
        ilike(users.email, `%${search}%`),
        sql`to_char(${payments.createdAt}, 'Mon DD, YYYY HH24:MI') ilike ${`%${search}%`}`
      )
    : undefined

  const [data, total] = await Promise.all([
    db
      .select({
        payment: payments,
        userEmail: users.email,
      })
      .from(payments)
      .leftJoin(users, eq(payments.userId, users.id))
      .where(whereClause)
      .orderBy(desc(payments.createdAt))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ value: count() })
      .from(payments)
      .leftJoin(users, eq(payments.userId, users.id))
      .where(whereClause),
  ])

  return {
    data: data.map((r) => ({ ...r.payment, userEmail: r.userEmail })),
    total: total[0]?.value || 0,
    page,
    pageSize,
    totalPages: Math.ceil((total[0]?.value || 0) / pageSize),
  }
}

export async function adminGetLicenses(page = 1, search = "", pageSize = 10) {
  await requireAdmin()

  const offset = (page - 1) * pageSize
  const whereClause = search
    ? or(
        ilike(users.email, `%${search}%`),
        ilike(licenses.status, `%${search}%`),
        ilike(licenses.revokedReason, `%${search}%`),
        ilike(plans.name, `%${search}%`),
        ilike(licenses.billingCycle, `%${search}%`),
        sql`to_char(${licenses.createdAt}, 'Mon DD, YYYY HH24:MI') ilike ${`%${search}%`}`
      )
    : undefined

  const [data, total] = await Promise.all([
    db
      .select({
        license: licenses,
        userEmail: users.email,
        planName: plans.name,
        planMode: plans.mode,
        planHasYearlyPlan: plans.hasYearlyPlan,
      })
      .from(licenses)
      .leftJoin(users, eq(licenses.userId, users.id))
      .leftJoin(plans, eq(licenses.planId, plans.id))
      .where(whereClause)
      .orderBy(desc(licenses.createdAt))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ value: count() })
      .from(licenses)
      .leftJoin(users, eq(licenses.userId, users.id))
      .leftJoin(plans, eq(licenses.planId, plans.id))
      .where(whereClause),
  ])

  return {
    data: data.map((r) => ({
      ...r.license,
      userEmail: r.userEmail,
      planName: r.planName,
      planMode: r.planMode,
      planHasYearlyPlan: r.planHasYearlyPlan,
    })),
    total: total[0]?.value || 0,
    page,
    pageSize,
    totalPages: Math.ceil((total[0]?.value || 0) / pageSize),
  }
}

export async function adminGetDomains(page = 1, search = "", pageSize = 10) {
  await requireAdmin()

  const offset = (page - 1) * pageSize
  const whereClause = search
    ? or(
        ilike(domains.domainName, `%${search}%`),
        ilike(users.email, `%${search}%`),
        sql`(case when ${domains.deletedAt} is null then 'active' else 'deleted' end) ilike ${`%${search}%`}`,
        sql`to_char(${domains.createdAt}, 'Mon DD, YYYY HH24:MI') ilike ${`%${search}%`}`
      )
    : undefined

  const [data, total] = await Promise.all([
    db
      .select({
        domain: domains,
        userEmail: users.email,
      })
      .from(domains)
      .leftJoin(users, eq(domains.userId, users.id))
      .where(whereClause)
      .orderBy(desc(domains.createdAt))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ value: count() })
      .from(domains)
      .leftJoin(users, eq(domains.userId, users.id))
      .where(whereClause),
  ])

  return {
    data: data.map((r) => ({ ...r.domain, userEmail: r.userEmail })),
    total: total[0]?.value || 0,
    page,
    pageSize,
    totalPages: Math.ceil((total[0]?.value || 0) / pageSize),
  }
}

export async function adminGetOrders(page = 1, search = "", pageSize = 10) {
  await requireAdmin()

  const offset = (page - 1) * pageSize
  const whereClause = search
    ? or(
        ilike(orders.contactName, `%${search}%`),
        ilike(orders.status, `%${search}%`),
        ilike(users.email, `%${search}%`),
        ilike(plans.name, `%${search}%`),
        sql`to_char(${orders.createdAt}, 'Mon DD, YYYY HH24:MI') ilike ${`%${search}%`}`
      )
    : undefined

  const [data, total] = await Promise.all([
    db
      .select({
        order: orders,
        userEmail: users.email,
        planName: plans.name,
        planMode: plans.mode,
        planHasYearlyPlan: plans.hasYearlyPlan,
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .leftJoin(plans, eq(orders.planId, plans.id))
      .where(whereClause)
      .orderBy(desc(orders.createdAt))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ value: count() })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .leftJoin(plans, eq(orders.planId, plans.id))
      .where(whereClause),
  ])

  return {
    data: data.map((r) => ({
      ...r.order,
      userEmail: r.userEmail,
      planName: r.planName,
      planMode: r.planMode,
      planHasYearlyPlan: r.planHasYearlyPlan,
    })),
    total: total[0]?.value || 0,
    page,
    pageSize,
    totalPages: Math.ceil((total[0]?.value || 0) / pageSize),
  }
}

export async function adminGetAuditLogs(page = 1, search = "", pageSize = 10) {
  await requireAdmin()

  const offset = (page - 1) * pageSize
  const whereClause = search
    ? or(
        ilike(auditLogs.action, `%${search}%`),
        ilike(auditLogs.entityType, `%${search}%`),
        ilike(auditLogs.entityId, `%${search}%`),
        ilike(users.email, `%${search}%`),
        sql`to_char(${auditLogs.createdAt}, 'Mon DD, YYYY HH24:MI') ilike ${`%${search}%`}`
      )
    : undefined

  const [data, total] = await Promise.all([
    db
      .select({
        auditLog: auditLogs,
        actorEmail: users.email,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.actorUserId, users.id))
      .where(whereClause)
      .orderBy(desc(auditLogs.createdAt))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ value: count() })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.actorUserId, users.id))
      .where(whereClause),
  ])

  return {
    data: data.map((r) => ({ ...r.auditLog, actorEmail: r.actorEmail })),
    total: total[0]?.value || 0,
    page,
    pageSize,
    totalPages: Math.ceil((total[0]?.value || 0) / pageSize),
  }
}

export async function adminGetWebhookEvents(
  page = 1,
  search = "",
  pageSize = 10
) {
  await requireAdmin()

  const offset = (page - 1) * pageSize
  const whereClause = search
    ? or(
        ilike(webhookEvents.eventId, `%${search}%`),
        ilike(webhookEvents.type, `%${search}%`),
        ilike(webhookEvents.customerEmail, `%${search}%`),
        ilike(webhookEvents.processingError, `%${search}%`),
        sql`(case when ${webhookEvents.processed} then 'processed' else 'pending' end) ilike ${`%${search}%`}`,
        sql`to_char(${webhookEvents.createdAt}, 'Mon DD, YYYY HH24:MI') ilike ${`%${search}%`}`
      )
    : undefined

  const [data, total] = await Promise.all([
    db
      .select()
      .from(webhookEvents)
      .where(whereClause)
      .orderBy(desc(webhookEvents.createdAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ value: count() }).from(webhookEvents).where(whereClause),
  ])

  return {
    data,
    total: total[0]?.value || 0,
    page,
    pageSize,
    totalPages: Math.ceil((total[0]?.value || 0) / pageSize),
  }
}

export async function adminUpdateUserRole(
  userId: string,
  role: "admin" | "user"
) {
  const session = await requireAdmin()

  if (userId === session.userId) {
    return { error: "You cannot change your own role" as const }
  }

  if (role !== "admin" && role !== "user") {
    return { error: "Invalid role" as const }
  }

  const [user] = await db
    .select({ id: users.id, email: users.email, role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (!user) {
    return { error: "User not found" as const }
  }

  if (user.role === role) {
    return { success: true as const, role }
  }

  await db
    .update(users)
    .set({ role, updatedAt: new Date() })
    .where(eq(users.id, userId))

  await createAuditLog(
    session.userId,
    "admin.user_role_updated",
    "user",
    userId,
    { previousRole: user.role, newRole: role, email: user.email }
  )

  revalidatePath("/admin/users")
  return { success: true as const, role }
}

export async function adminGetUserSummary(userId: string) {
  await requireAdmin()

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (!user) {
    return { error: "User not found" as const }
  }

  const [licenseCount, paymentCount, orderCount, domainCount, auditLogCount] =
    await Promise.all([
      db
        .select({ value: count() })
        .from(licenses)
        .where(eq(licenses.userId, userId)),
      db
        .select({ value: count() })
        .from(payments)
        .where(eq(payments.userId, userId)),
      db
        .select({ value: count() })
        .from(orders)
        .where(eq(orders.userId, userId)),
      db
        .select({ value: count() })
        .from(domains)
        .where(eq(domains.userId, userId)),
      db
        .select({ value: count() })
        .from(auditLogs)
        .where(eq(auditLogs.actorUserId, userId)),
    ])

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
      loginMode: user.loginMode,
      company: user.company,
      country: user.country,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    counts: {
      licenses: licenseCount[0]?.value || 0,
      payments: paymentCount[0]?.value || 0,
      orders: orderCount[0]?.value || 0,
      domains: domainCount[0]?.value || 0,
      auditLogs: auditLogCount[0]?.value || 0,
    },
  }
}

export async function adminResendLoginNotification(userId: string) {
  const session = await requireAdmin()

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (!user) {
    return { error: "User not found" }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://shoptimity.com"
  const loginUrl = `${appUrl}/login`

  await enqueueEmailJob({
    template: "login-notification",
    to: user.email,
    props: {
      loginUrl,
    },
  })

  await createAuditLog(
    session.userId,
    "admin.resend_login_notification",
    "user",
    userId,
    { email: user.email }
  )

  revalidatePath("/admin")
  return { success: true }
}

export async function adminGetLicenseDomains(licenseId: string) {
  await requireAdmin()

  const data = await db
    .select({
      id: domains.id,
      domainName: domains.domainName,
      createdAt: domains.createdAt,
      deletedAt: domains.deletedAt,
    })
    .from(domains)
    .where(eq(domains.licenseId, licenseId))
    .orderBy(domains.createdAt)

  return data
}

export async function adminRevokeLicense(licenseId: string) {
  const session = await requireAdmin()

  const [license] = await db
    .select()
    .from(licenses)
    .where(eq(licenses.id, licenseId))
    .limit(1)

  if (!license) {
    return { error: "License not found" }
  }

  // Soft-delete all domains
  const activeDomains = await db
    .select()
    .from(domains)
    .where(and(eq(domains.licenseId, licenseId), isNull(domains.deletedAt)))

  for (const domain of activeDomains) {
    await db
      .update(domains)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(domains.id, domain.id))

    await enqueueLicenseMetadataExportJob({
      domainName: domain.domainName,
      userId: license.userId,
      action: "delete",
    })
  }

  // Revoke license
  await db
    .update(licenses)
    .set({
      status: "revoked",
      isLifetime: false,
      revokedReason: "admin_action",
      updatedAt: new Date(),
    })
    .where(eq(licenses.id, licenseId))

  // Notify user
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, license.userId))
    .limit(1)

  if (user) {
    await enqueueEmailJob({
      template: "license-revoked",
      to: user.email,
      props: {
        email: user.email,
        reason: "admin_action" as const,
        planName: "License",
        domainCount: activeDomains.length,
      },
    })
  }

  await createAuditLog(
    session.userId,
    "admin.license_revoked",
    "license",
    licenseId,
    { userId: license.userId }
  )

  revalidatePath("/admin")
  return { success: true }
}
