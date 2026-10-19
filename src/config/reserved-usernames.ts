/** Usernames that would collide with app routes or are misleading. */
export const RESERVED_USERNAMES = new Set([
  "admin", "api", "app", "auth", "billing", "blog", "dashboard", "docs", "domain", "features",
  "forgot-password", "help", "login", "logout", "pricing", "privacy", "register", "reset-password",
  "s", "settings", "shop", "signup", "static", "support", "templates", "terms", "_next", "about",
  "contact", "root", "www", "mail", "status", "nickname", "favicon.ico", "robots.txt", "sitemap.xml",
]);

export const USERNAME_REGEX = /^[a-z0-9](?:[a-z0-9._-]{1,28}[a-z0-9])$/;
