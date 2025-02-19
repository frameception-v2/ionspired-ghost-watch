"use client";

import { useEffect, useCallback, useState } from "react";
import sdk, {
  AddFrame,
  SignIn as SignInCore,
  type Context,
} from "@farcaster/frame-sdk";

export default function Frame() {
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "~/components/ui/card";
import { NeynarAPIClient, Configuration } from "@neynar/nodejs-sdk";
import { config } from "~/components/providers/WagmiProvider";
import { truncateAddress } from "~/lib/truncateAddress";
import { useSession } from "next-auth/react";
import { createStore } from "mipd";
import { Label } from "~/components/ui/label";
import { PROJECT_TITLE, NEYNAR_API_KEY } from "~/lib/constants";
import { Skeleton } from "~/components/ui/skeleton";
import Image from "next/image"; // Add Image import

const neynarClient = new NeynarAPIClient(new Configuration({ apiKey: NEYNAR_API_KEY }));

// ... rest of the code remains the same until UnfollowList...

function UnfollowList({ unfollows }: { unfollows: UnfollowEvent[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Unfollow Activity</CardTitle>
        <CardDescription>
          Users who stopped following you, sorted by most recent
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {unfollows.length === 0 ? (
          <div className="text-center text-gray-500">
            No unfollow activity detected 🎉
          </div>
        ) : (
          unfollows.map((user) => (
            <div key={user.fid} className="flex items-center gap-4">
              <Image
                src={user.pfpUrl}
                alt={user.username}
                width={40}
                height={40}
                className="h-10 w-10 rounded-full"
                loader={({ src }) => src} // Add custom loader if needed
              />
              <div className="flex-1">
                <div className="font-medium">{user.displayName}</div>
                <div className="text-sm text-gray-500">@{user.username}</div>
              </div>
              <div className="text-sm text-gray-500">
                {user.lastActive.toLocaleDateString()}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

// ... rest of the file remains the same ...
