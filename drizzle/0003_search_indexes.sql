CREATE INDEX "authors_name_trgm_idx" ON "authors" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "works_title_trgm_idx" ON "works" USING gin ("title" gin_trgm_ops);