import { db } from "./db.js";

async function createDb() {

    // User
    await db.schema.createTable("User", table => {
        table.integer("id").primary();
        table.string("email").unique();
        table.string("passwordHash");
        table.string("name");
        table.integer("roleId").references("id").inTable("Role");
        table.dateTime("createdAt").notNullable().defaultTo(db.fn.now());
        table.dateTime("updatedAt").notNullable().defaultTo(db.fn.now());
    })
    
    // Role
    await db.schema.createTable("Role", table => {
        table.integer("id").primary();
        table.string("name");
        table.string("description");
    })
    
    // Permission
    await db.schema.createTable("Permission", table => {
        table.integer("id").primary();
        table.integer("roleId").references("id").inTable("Role");
        table.integer("entityId").references("id").inTable("Entity");
        table.boolean("canCreate");
        table.boolean("canRead");
        table.boolean("canUpdate");
        table.boolean("canDelete");
    })
    
    // Entity
    await db.schema.createTable("Entity", table => {
        table.integer("id").primary();
        table.string("name");
        table.string("slug").unique();
        table.string("tableName");
        table.dateTime("createdAt").notNullable().defaultTo(db.fn.now());
        table.dateTime("updatedAt").notNullable().defaultTo(db.fn.now());
    })
    
    // Field
    await db.schema.createTable("Field", table => {
        table.integer("id").primary();
        table.integer("entityId").references("id").inTable("Entity");
        table.string("name");
        table.string("slug");
        table.string("type");
        table.boolean("required");
        table.boolean("uniqueField");
        table.string("defaultValue");
        table.string("configJson");
        table.integer("position");

        table.index(["entityId"]);
    })
    
    // Relation
    await db.schema.createTable("Relation", table => {
        table.integer("id").primary();
        table.integer("fieldId").references("id").inTable("Field");
        table.string("relationType");
        table.integer("targetEntityId").references("id").inTable("Entity");
        table.string("pivotTable");
    })
    
    // Record
    await db.schema.createTable("Record", table => {
        table.integer("id").primary();
        table.integer("entityId").references("id").inTable("Entity");
        table.text("dataJson");
        table.integer("createdById").references("id").inTable("User");
        table.integer("updatedById").references("id").inTable("User");
        table.dateTime("createdAt").notNullable().defaultTo(db.fn.now());
        table.dateTime("updatedAt").notNullable().defaultTo(db.fn.now());
        table.string("status");

        table.index(["entityId"]);
    })
    
    // RecordVersion
    await db.schema.createTable("RecordVersion", table => {
        table.integer("id").primary();
        table.integer("recordId").references("id").inTable("Record");
        table.integer("entityId").references("id").inTable("Entity");
        table.text("dataJson");
        table.dateTime("createdAt").notNullable().defaultTo(db.fn.now());
        table.integer("createdById").references("id").inTable("User");
    })
    
    // Media
    await db.schema.createTable("Media", table => {
        table.integer("id").primary();
        table.string("filename");
        table.string("mimeType");
        table.integer("size");
        table.string("path");
        table.string("altText");
        table.integer("uploadedById").references("id").inTable("User");
        table.dateTime("createdAt").notNullable().defaultTo(db.fn.now());
    })
    
    // Tag
    await db.schema.createTable("Tag", table => {
        table.integer("id").primary();
        table.string("name");
        table.string("slug").unique();
    })
    
    // RecordTag
    await db.schema.createTable("RecordTag", table => {
        table.integer("recordId").references("id").inTable("Record");
        table.integer("tagId").references("id").inTable("Tag");
        table.primary(["recordId", "tagId"]);
    })
    
    // ApiToken
    await db.schema.createTable("ApiToken", table => {
        table.integer("id").primary();
        table.string("name");
        table.string("tokenHash");
        table.dateTime("createdAt").notNullable().defaultTo(db.fn.now());
        table.dateTime("expiresAt");
    })
    
    // WebHook
    await db.schema.createTable("WebHook", table => {
        table.integer("id").primary();
        table.string("event");
        table.string("url");
        table.string("secret");
    })
}

async function seedDb() {

    // Roles
    await db("Role").insert([
        { id: 1, name: "admin", description: "Administrator" },
        { id: 2, name: "editor", description: "Content editor" }
    ])

    // Users
    await db("User").insert([
        {
            id: 1,
            email: "admin@test.com",
            passwordHash: "test",
            name: "Admin",
            roleId: 1
        },
        {
            id: 2,
            email: "editor@test.com",
            passwordHash: "test",
            name: "Editor",
            roleId: 2
        }
    ])

    console.log("Seed data inserted")
}

await createDb()
await seedDb()

console.log("Database created and seeded")
process.exit(0)