import { Elysia, t } from "elysia";
import { authPlugin } from "../../lib/auth";
import { FriendRequestModel } from "./model";
import { FriendRequestService } from "./service";

export const friendRequestRoutes = new Elysia({
  tags: ["friend-request"],
  prefix: "/friend-request",
})
  .use(authPlugin)
  .guard({ auth: true })
  .get(
    "/find",
    ({ user }) => {
      return FriendRequestService.find({ userId: user.id });
    },
    {
      response: {
        200: FriendRequestModel.friendRequestListResponse,
      },
    },
  )
  .get(
    "/:id",
    ({ user, params }) => {
      return FriendRequestService.get({ id: params.id, userId: user.id });
    },
    {
      response: {
        200: FriendRequestModel.friendRequestResponse,
        404: FriendRequestModel.friendRequestError,
        403: FriendRequestModel.friendRequestError,
      },
    },
  )
  .post(
    "/",
    ({ body, user }) => {
      return FriendRequestService.create({
        senderId: user.id,
        receiverId: body.receiverId,
      });
    },
    {
      body: t.Pick(FriendRequestModel.friendRequestResponse, ["receiverId"]),
      response: {
        200: FriendRequestModel.friendRequestResponse,
        400: FriendRequestModel.friendRequestError,
        404: FriendRequestModel.friendRequestError,
        409: FriendRequestModel.friendRequestError,
        422: FriendRequestModel.friendRequestError,
        500: FriendRequestModel.friendRequestError,
      },
    },
  )
  .get(
    "/auth-options/:id",
    ({ params, user }) => {
      return FriendRequestService.getAuthOptions({
        id: params.id,
        userId: user.id,
      });
    },
    {
      response: {
        200: FriendRequestModel.friendRequestAuthOptionsResponse,
        404: FriendRequestModel.friendRequestError,
        403: FriendRequestModel.friendRequestError,
        400: FriendRequestModel.friendRequestError,
      },
    },
  )
  .post(
    "/verify",
    ({ body, user }) => {
      return FriendRequestService.verify({
        id: body.id,
        authenticationResponse: body.authenticationResponse,
        userId: user.id,
      });
    },
    {
      body: FriendRequestModel.friendRequestVerifyBody,
      response: {
        200: FriendRequestModel.friendRequestResponse,
        404: FriendRequestModel.friendRequestError,
        400: FriendRequestModel.friendRequestError,
        403: FriendRequestModel.friendRequestError,
        422: FriendRequestModel.friendRequestError,
        500: FriendRequestModel.friendRequestError,
      },
    },
  )
  .patch(
    "/reject/:id",
    ({ params, user }) => {
      return FriendRequestService.reject({ id: params.id, userId: user.id });
    },
    {
      response: {
        200: FriendRequestModel.friendRequestResponse,
        404: FriendRequestModel.friendRequestError,
        403: FriendRequestModel.friendRequestError,
        400: FriendRequestModel.friendRequestError,
        500: FriendRequestModel.friendRequestError,
      },
    },
  )
  .delete(
    "/:id",
    ({ params, user }) => {
      return FriendRequestService.delete({ id: params.id, userId: user.id });
    },
    {
      response: {
        200: FriendRequestModel.friendRequestResponse,
        404: FriendRequestModel.friendRequestError,
        403: FriendRequestModel.friendRequestError,
        400: FriendRequestModel.friendRequestError,
        500: FriendRequestModel.friendRequestError,
      },
    },
  );
