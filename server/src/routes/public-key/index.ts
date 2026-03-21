import { Elysia } from "elysia";
import { authPlugin } from "../../lib/auth";
import { PublicKeyModel } from "./model";
import { PublicKeyService } from "./service";

export const publicKeyRoutes = new Elysia({
  tags: ["public-key"],
  prefix: "/public-key",
})
  .use(authPlugin)
  .get("/", ({ user }) => PublicKeyService.get({ userId: user.id }), {
    auth: true,
    response: {
      200: PublicKeyModel.publicKeyResponse,
      404: PublicKeyModel.publicKeyError,
    },
  })
  .post(
    "/",
    ({ user, body }) =>
      PublicKeyService.create({ userId: user.id, publicKey: body.publicKey }),
    {
      auth: true,
      body: PublicKeyModel.publicKeyBody,
      response: {
        200: PublicKeyModel.publicKeyResponse,
        409: PublicKeyModel.publicKeyError,
        500: PublicKeyModel.publicKeyError,
      },
    },
  )
  .put(
    "/",
    ({ user, body }) =>
      PublicKeyService.update({ userId: user.id, publicKey: body.publicKey }),
    {
      auth: true,
      body: PublicKeyModel.publicKeyBody,
      response: {
        200: PublicKeyModel.publicKeyResponse,
        404: PublicKeyModel.publicKeyError,
      },
    },
  )
  .delete("/", ({ user }) => PublicKeyService.delete({ userId: user.id }), {
    auth: true,
    response: {
      200: PublicKeyModel.publicKeyResponse,
      404: PublicKeyModel.publicKeyError,
    },
  });
