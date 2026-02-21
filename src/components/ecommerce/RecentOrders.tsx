"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";

interface RecentOrdersProps {
  orders: any[];
}

export default function RecentOrders({ orders }: RecentOrdersProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Recent Orders
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/admin/orders" className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200">
            See all
          </Link>
        </div>
      </div>
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
            <TableRow>
              <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                Order Info
              </TableCell>
              <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                Date
              </TableCell>
              <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                Price
              </TableCell>
              <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                Status
              </TableCell>
              <TableCell isHeader className="py-3 font-medium text-gray-500 text-end text-theme-xs dark:text-gray-400">
                Action
              </TableCell>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="py-3">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                        {order.orderCode}
                      </p>
                      <span className="text-gray-500 text-theme-xs dark:text-gray-400">
                        {order.customer?.fullName}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  {format(new Date(order.createdAt), "dd MMM yyyy")}
                </TableCell>
                <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  ${Number(order.total).toFixed(2)}
                </TableCell>
                <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  <Badge
                    size="sm"
                    color={
                      order.orderStatus === "DELIVERED"
                        ? "success"
                        : order.orderStatus === "PENDING"
                          ? "warning"
                          : order.orderStatus === "CANCELLED"
                            ? "error"
                            : "primary"
                    }
                  >
                    {order.orderStatus}
                  </Badge>
                </TableCell>
                <TableCell className="py-3 text-right">
                  <Link href={`/admin/orders/${order.id}`} className="text-blue-600 hover:text-blue-800 text-sm font-medium">View</Link>
                </TableCell>
              </TableRow>
            ))}
            {orders.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-6 text-center text-gray-500">No orders found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
