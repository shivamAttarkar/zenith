FROM oven/bun AS migrate

WORKDIR /app

# Cache packages installation
COPY package.json package.json
COPY bun.lock bun.lock

RUN bun install

COPY ./src ./src
COPY drizzle.config.ts drizzle.config.ts

FROM migrate AS build

ENV NODE_ENV=production

RUN bun build \
	--compile \
	--minify-whitespace \
	--minify-syntax \
	--outfile server \
	src/index.ts

FROM oven/bun

WORKDIR /app

COPY --from=build /app/server server
COPY --from=build /app/src/cluster.ts cluster.ts

CMD ["bun", "cluster.ts"]

EXPOSE 3000
