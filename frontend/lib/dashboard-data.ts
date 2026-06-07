import { ArrowLeftRight, Package, ShoppingCart } from "lucide-react"

import type {
  ChartDataPoint,
  DashboardStat,
  MovementHistoryItem,
} from "@/types"

export const dashboardStats: DashboardStat[] = [
  {
    title: "Total Assets",
    value: "2,847",
    change: "+124",
    trend: "up",
    icon: Package,
    accent: "green",
  },
  {
    title: "Total Purchase Orders",
    value: "1,456",
    change: "+38",
    trend: "up",
    icon: ShoppingCart,
    accent: "dark",
  },
  {
    title: "Total In/Out History",
    value: "8,932",
    change: "+215",
    trend: "up",
    icon: ArrowLeftRight,
    accent: "teal",
  },
]

export const assetPerformanceData: ChartDataPoint[] = [
  { name: "Jan", value: 72, secondary: 80 },
  { name: "Feb", value: 75, secondary: 80 },
  { name: "Mar", value: 78, secondary: 82 },
  { name: "Apr", value: 81, secondary: 82 },
  { name: "May", value: 84, secondary: 85 },
  { name: "Jun", value: 87, secondary: 85 },
  { name: "Jul", value: 89, secondary: 88 },
  { name: "Aug", value: 91, secondary: 88 },
]

export const itemsMovementHistory: MovementHistoryItem[] = [
  {
    id: "1",
    itemCode: "ITM-2041",
    itemName: "EV Battery Module 48V",
    movement: "in",
    quantity: 120,
    location: "Warehouse A",
    time: "2 minutes ago",
  },
  {
    id: "2",
    itemCode: "ITM-1187",
    itemName: "Charging Cable Type-2",
    movement: "out",
    quantity: 45,
    location: "Dispatch Bay 3",
    time: "18 minutes ago",
  },
  {
    id: "3",
    itemCode: "ITM-3302",
    itemName: "Motor Controller Unit",
    movement: "in",
    quantity: 80,
    location: "Warehouse B",
    time: "42 minutes ago",
  },
  {
    id: "4",
    itemCode: "ITM-0924",
    itemName: "Fleet GPS Tracker",
    movement: "out",
    quantity: 32,
    location: "Field Service Hub",
    time: "1 hour ago",
  },
  {
    id: "5",
    itemCode: "ITM-4410",
    itemName: "Thermal Sensor Pack",
    movement: "in",
    quantity: 200,
    location: "Warehouse A",
    time: "2 hours ago",
  },
  {
    id: "6",
    itemCode: "ITM-2756",
    itemName: "Brake Pad Set EV-200",
    movement: "out",
    quantity: 64,
    location: "Maintenance Depot",
    time: "3 hours ago",
  },
]
