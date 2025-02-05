"use client";

import { useEffect, useCallback, useState } from "react";
import sdk, {
  AddFrame,
  SignIn as SignInCore,
  type Context,
} from "@farcaster/frame-sdk";
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

const neynarClient = new NeynarAPIClient(new Configuration({ apiKey: NEYNAR_API_KEY }));

interface UnfollowEvent {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
  lastActive: Date;
}

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
              <img
                src={user.pfpUrl}
                alt={user.username}
                className="h-10 w-10 rounded-full"
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

export default function Frame() {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<Context.FrameContext>();
  const [unfollows, setUnfollows] = useState<UnfollowEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: session } = useSession();

  const fetchUnfollowData = useCallback(async () => {
    try {
      if (!session?.user?.fid) return;

      // Get followers and following lists
      const { followers } = await neynarClient.fetchFollowers(session.user.fid);
      const { following } = await neynarClient.fetchFollowing(session.user.fid);

      // Find users who are in followers but not in following (unfollowed)
      const followerFids = new Set(followers.map(u => u.fid));
      const unfollowEvents = following
        .filter(user => !followerFids.has(user.fid))
        .map(user => ({
          fid: user.fid,
          username: user.username,
          displayName: user.displayName,
          pfpUrl: user.pfpUrl,
          lastActive: new Date(user.timestamp || Date.now())
        }))
        .sort((a, b) => b.lastActive.getTime() - a.lastActive.getTime());

      setUnfollows(unfollowEvents);
    } catch (error) {
      console.error("Error fetching unfollow data:", error);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    const load = async () => {
      const context = await sdk.context;
      if (!context) return;

      setContext(context);
      sdk.actions.ready({});
      
      // Load data when SDK is ready
      fetchUnfollowData();

      sdk.on("frameAdded", ({ notificationDetails }) => {
        window.location.reload();
      });

      sdk.on("frameRemoved", () => {
        window.location.reload();
      });
    };

    if (sdk && !isSDKLoaded) {
      setIsSDKLoaded(true);
      load();
      return () => sdk.removeAllListeners();
    }
  }, [isSDKLoaded, fetchUnfollowData]);

  if (!isSDKLoaded) {
    return <div className="w-full text-center">Initializing Ghost Watch...</div>;
  }

  return (
    <div style={{
      paddingTop: context?.client.safeAreaInsets?.top ?? 0,
      paddingBottom: context?.client.safeAreaInsets?.bottom ?? 0,
      paddingLeft: context?.client.safeAreaInsets?.left ?? 0,
      paddingRight: context?.client.safeAreaInsets?.right ?? 0,
    }}>
      <div className="w-[300px] mx-auto py-2 px-2">
        <h1 className="text-2xl font-bold text-center mb-4 text-neutral-900">
          {PROJECT_TITLE}
        </h1>
        
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-[125px] w-full rounded-xl" />
            <Skeleton className="h-[100px] w-full rounded-xl" />
          </div>
        ) : (
          <UnfollowList unfollows={unfollows} />
        )}
      </div>
    </div>
  );
}
