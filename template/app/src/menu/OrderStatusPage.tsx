import React from "react";
import { useParams } from "react-router-dom";

export default function OrderStatusPage() {
  const { orderId } = useParams<{ orderId: string }>();
  return (
    <div className="flex h-screen items-center justify-center p-8 text-center">
       <div>
         <h1 className="text-2xl font-bold mb-4">Order Received!</h1>
         <p className="text-gray-500">Your order #{orderId} has been placed successfully. (Full status page coming in Task 9)</p>
       </div>
    </div>
  );
}
