"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api-client"
import type { Review, AdminReviewsResponse } from "@/types/api"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { useState } from "react"
import { Search, Trash2, Star } from "lucide-react"

const REVIEW_LIMIT = 20

export default function ReviewsContent() {
  const queryClient = useQueryClient()
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ["admin-reviews", search, page],
    queryFn: () => api.get<AdminReviewsResponse>(
      `/admin/reviews?page=${page}&per_page=${REVIEW_LIMIT}${search ? `&product_id=${search}` : ""}`,
    ),
  })

  const reviews = data?.reviews || []
  const total = data?.total || 0
  const totalPages = Math.ceil(total / REVIEW_LIMIT)

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/reviews/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] })
      toast.success("Review deleted")
      setDeleteId(null)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Reviews</h1>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search by product ID..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="pl-9" />
      </div>

      {isLoading ? (
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
      ) : !reviews?.length ? (
        <p className="text-sm text-muted-foreground">No reviews found.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Comment</TableHead>
              <TableHead>Date</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {reviews.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="text-muted-foreground">{r.id}</TableCell>
                <TableCell className="font-medium">#{r.product_id}</TableCell>
                <TableCell className="text-muted-foreground">{r.user?.email || `#${r.user_id}`}</TableCell>
                <TableCell>
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
                    ))}
                  </div>
                </TableCell>
                <TableCell className="max-w-xs truncate text-muted-foreground">{r.comment}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </TableCell>
                <TableCell>
                  <Dialog open={deleteId === r.id} onOpenChange={(open) => { if (!open) setDeleteId(null) }}>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(r.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Delete Review</DialogTitle>
                        <DialogDescription>Delete this review? This will recalculate the product&apos;s rating.</DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={() => deleteMutation.mutate(r.id)} disabled={deleteMutation.isPending}>
                          {deleteMutation.isPending ? "Deleting..." : "Delete"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {data && totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  )
}
