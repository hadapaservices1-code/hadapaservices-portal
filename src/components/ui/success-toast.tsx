'use client'

import { motion } from 'framer-motion'
import { CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

interface SuccessToastProps {
  title: string
  description?: string
  duration?: number
}

export function showSuccessToast({ title, description, duration = 4000 }: SuccessToastProps) {
  toast.success(title, {
    description,
    duration,
    className: 'success-toast',
    action: {
      label: 'Dismiss',
      onClick: () => toast.dismiss(),
    },
  })
}

// Custom success toast component with animations
export function SuccessToastContent({ title, description }: { title: string; description?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: -20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: -20 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
        duration: 0.3
      }}
      className="flex items-start gap-3 p-4 bg-white border border-green-200 rounded-lg shadow-lg"
    >
      {/* Animated checkmark icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 15,
          delay: 0.1
        }}
        className="flex-shrink-0"
      >
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 20,
            delay: 0.2
          }}
          className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center"
        >
          <motion.div
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{
              duration: 0.5,
              delay: 0.4,
              ease: "easeInOut"
            }}
          >
            <CheckCircle className="w-5 h-5 text-white" />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <motion.h4
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className="text-sm font-semibold text-gray-900"
        >
          {title}
        </motion.h4>
        {description && (
          <motion.p
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.3 }}
            className="text-xs text-gray-600 mt-1"
          >
            {description}
          </motion.p>
        )}
      </div>

      {/* Success indicator line */}
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: "100%" }}
        transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
        className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-green-400 to-green-600 rounded-b-lg"
      />
    </motion.div>
  )
}

// Predefined success toasts for common actions
export const SuccessToasts = {
  leaveSubmitted: () => showSuccessToast({
    title: "Leave Request Submitted! 🎉",
    description: "Your leave request has been sent to your manager for approval.",
  }),

  leaveApproved: () => showSuccessToast({
    title: "Leave Request Approved! ✅",
    description: "The leave request has been approved and added to the calendar.",
  }),

  leaveRejected: () => showSuccessToast({
    title: "Leave Request Rejected",
    description: "The leave request has been rejected. Please check the comments for details.",
  }),

  expenseSubmitted: () => showSuccessToast({
    title: "Expense Submitted! 💰",
    description: "Your expense has been submitted and is pending manager approval.",
  }),

  expenseApproved: () => showSuccessToast({
    title: "Expense Approved! ✅",
    description: "The expense has been approved and will be processed for reimbursement.",
  }),

  expenseRejected: () => showSuccessToast({
    title: "Expense Rejected",
    description: "The expense has been rejected. Please check the comments for details.",
  }),

  projectCreated: () => showSuccessToast({
    title: "Project Created! 🚀",
    description: "Your new project has been created successfully.",
  }),

  taskCreated: () => showSuccessToast({
    title: "Task Created! 📋",
    description: "Your new task has been created and assigned.",
  }),

  timesheetSubmitted: () => showSuccessToast({
    title: "Timesheet Submitted! ⏰",
    description: "Your timesheet has been submitted for review.",
  }),
}
