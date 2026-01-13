import { useState } from "react";
import {
  Users,
  Loader2,
  Search,
  Filter,
  ShieldOff,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/EmptyState";
import { useAllUsers, useUsersByRole, useFreezeUser } from "@/hooks";
import { toast } from "sonner";

const roleColors: Record<string, string> = {
  CLIENT: "bg-blue-100 text-blue-800",
  AGENT: "bg-purple-100 text-purple-800",
  COURIER: "bg-orange-100 text-orange-800",
  STAFF: "bg-green-100 text-green-800",
  ADMIN: "bg-red-100 text-red-800",
  FINANCE: "bg-yellow-100 text-yellow-800",
  RISK: "bg-pink-100 text-pink-800",
};

export default function UserAccountManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");

  const {
    data: allUsers,
    isLoading: loadingAll,
    error: errorAll,
  } = useAllUsers();
  const {
    data: filteredUsers,
    isLoading: loadingFiltered,
    error: errorFiltered,
  } = useUsersByRole(roleFilter === "ALL" ? "" : roleFilter);

  const freezeUser = useFreezeUser();

  const isLoading = roleFilter === "ALL" ? loadingAll : loadingFiltered;
  const error = roleFilter === "ALL" ? errorAll : errorFiltered;
  const users = roleFilter === "ALL" ? (allUsers ?? []) : (filteredUsers ?? []);

  const displayedUsers = users.filter((u) => {
    const matchesSearch =
      u.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.phone.includes(searchQuery) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleFreezeToggle = (userId: string, currentlyFrozen: boolean) => {
    const action = currentlyFrozen ? "unfreeze" : "freeze";
    freezeUser.mutate(
      { userId, frozen: !currentlyFrozen },
      {
        onSuccess: () => toast.success(`User account ${action}d successfully`),
        onError: (err) =>
          toast.error(
            err instanceof Error ? err.message : `Failed to ${action} user`,
          ),
      },
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">User Account Management</h1>
        <p className="text-muted-foreground">
          View all user accounts and manage account freeze status
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>All User Accounts</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-52"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Roles</SelectItem>
                  <SelectItem value="CLIENT">Client</SelectItem>
                  <SelectItem value="AGENT">Agent</SelectItem>
                  <SelectItem value="COURIER">Courier</SelectItem>
                  <SelectItem value="STAFF">Staff</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="FINANCE">Finance</SelectItem>
                  <SelectItem value="RISK">Risk</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <EmptyState
              icon={Users}
              title="Error loading users"
              description={
                error instanceof Error ? error.message : "An error occurred"
              }
            />
          ) : displayedUsers.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No users found"
              description={
                searchQuery || roleFilter !== "ALL"
                  ? "Try adjusting your filters"
                  : "No user accounts exist yet"
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {user.fullName || "—"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {user.id.slice(0, 8)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{user.phone}</div>
                        {user.email && (
                          <div className="text-muted-foreground">
                            {user.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          roleColors[user.role] || "bg-gray-100 text-gray-800"
                        }
                      >
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.frozen ? (
                        <Badge className="bg-red-100 text-red-800">
                          <ShieldOff className="w-3 h-3 mr-1" />
                          Frozen
                        </Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-800">
                          <ShieldCheck className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant={user.frozen ? "default" : "destructive"}
                        size="sm"
                        onClick={() => handleFreezeToggle(user.id, user.frozen)}
                        disabled={freezeUser.isPending}
                      >
                        {freezeUser.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : user.frozen ? (
                          <>
                            <ShieldCheck className="w-4 h-4 mr-1" />
                            Unfreeze
                          </>
                        ) : (
                          <>
                            <ShieldOff className="w-4 h-4 mr-1" />
                            Freeze
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
