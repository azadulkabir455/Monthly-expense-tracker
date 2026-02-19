"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { addWish, selectWishPriorities } from "@/store/slices/wishlistSlice";
import type { WishIconType } from "@/types/wishlist";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/blocks/elements/Card";
import { Button } from "@/blocks/elements/Button";
import { Input } from "@/blocks/elements/Input";
import { Label } from "@/blocks/elements/Label";
import { SelectDropdown } from "@/blocks/components/shared/SelectDropdown";
import { IconSearchInput } from "@/blocks/components/shared/IconSearchInput";

export function AddWishFormSection() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const priorities = useAppSelector(selectWishPriorities);
  const [name, setName] = useState("");
  const [approximateAmount, setApproximateAmount] = useState("");
  const [priorityId, setPriorityId] = useState<string>("");
  const [iconType, setIconType] = useState<WishIconType>("gift");
  const [loading, setLoading] = useState(false);

  const priorityOptions = priorities.map((p) => ({ value: p.id, label: p.name }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number.parseInt(approximateAmount, 10);
    if (!name.trim() || Number.isNaN(amount) || amount < 0) return;
    setLoading(true);
    dispatch(
      addWish({
        name: name.trim(),
        approximateAmount: amount,
        priorityId: priorityId || priorities[0]?.id || "",
        iconType,
      })
    );
    setLoading(false);
    setName("");
    setApproximateAmount("");
    setPriorityId(priorities[0]?.id ?? "");
    setIconType("gift");
    router.push("/dashboard/wishlist");
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Add Wish</CardTitle>
        <CardDescription>
          Add a new item to your wish list with name, approximate cost, and priority.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="wish-name">Name</Label>
            <Input
              id="wish-name"
              placeholder="e.g. MacBook Pro"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wish-amount">Approximate Amount (৳)</Label>
            <Input
              id="wish-amount"
              type="number"
              min={0}
              placeholder="e.g. 150000"
              value={approximateAmount}
              onChange={(e) => setApproximateAmount(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 items-end gap-4">
            <SelectDropdown
              options={priorityOptions}
              value={priorityId}
              onChange={(v) => setPriorityId(String(v))}
              label="Priority"
            />
            <IconSearchInput
              value={iconType}
              onChange={setIconType}
              label="Icon"
              id="add-wish-form-icon"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 sm:flex-row">
          <Button type="submit" className="w-full sm:w-auto" disabled={loading}>
            {loading ? "Adding..." : "Add Wish"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={() => router.push("/dashboard/wishlist")}
          >
            Cancel
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
