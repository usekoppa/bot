export const enum Category {
  Information = "Information",
  Moderation = "Moderation",
  Tools = "Tools",
}

export const categoryEmojis = new Map<Category, string>();

categoryEmojis.set(Category.Information, ":information_source:");
categoryEmojis.set(Category.Moderation, ":zap:");
categoryEmojis.set(Category.Tools, ":tools:");
