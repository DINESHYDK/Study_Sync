import { ComparisonView } from "@/components/friends/ComparisonView";

type FriendDetailPageProps = {
  params: {
    friendId: string;
  };
};

export default function FriendDetailPage({ params }: FriendDetailPageProps) {
  return <ComparisonView friendId={params.friendId} />;
}
