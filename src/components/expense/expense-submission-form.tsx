"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { expenseSubmissionSchema, type ExpenseSubmissionFormData } from "@/lib/validations"
import { getExpenseCategories, createExpense, type ExpenseCategory } from "@/lib/expenses"
import { toast } from "sonner"
import { SuccessToasts } from "@/components/ui/success-toast"
import { Loader2, Receipt, DollarSign, Calendar, FileText, Tag } from "lucide-react"

interface ExpenseSubmissionFormProps {
  employeeId: string
  onExpenseSubmitted?: () => void
  onCancel?: () => void
}

export function ExpenseSubmissionForm({ 
  employeeId, 
  onExpenseSubmitted, 
  onCancel 
}: ExpenseSubmissionFormProps) {
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<ExpenseSubmissionFormData>({
    resolver: zodResolver(expenseSubmissionSchema),
    defaultValues: {
      currency: "USD",
      expenseDate: new Date().toISOString().split('T')[0]
    }
  })

  const selectedCategoryId = watch("categoryId")
  const selectedCategory = categories.find(cat => cat.id === selectedCategoryId)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true)
        const data = await getExpenseCategories()
        setCategories(data)
      } catch (error) {
        console.error('Error fetching categories:', error)
        toast.error('Failed to load expense categories')
      } finally {
        setIsLoading(false)
      }
    }

    fetchCategories()
  }, [])

  const onSubmit = async (data: ExpenseSubmissionFormData) => {
    try {
      setIsSubmitting(true)
      
      const result = await createExpense(employeeId, {
        categoryId: data.categoryId,
        title: data.title,
        description: data.description,
        amount: data.amount,
        currency: data.currency,
        expenseDate: data.expenseDate,
        receiptUrl: data.receiptUrl || undefined
      })

      if (result.success) {
        SuccessToasts.expenseSubmitted()
        reset()
        onExpenseSubmitted?.()
      } else {
        toast.error(result.message || 'Failed to submit expense')
      }
    } catch (error) {
      console.error('Error submitting expense:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading expense categories...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Submit New Expense
        </CardTitle>
        <CardDescription>
          Fill out the form below to submit a new expense for approval
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Category Selection */}
          <div className="space-y-2">
            <Label htmlFor="categoryId" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Category *
            </Label>
            <Select onValueChange={(value) => setValue("categoryId", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select expense category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex flex-col">
                      <span>{category.name}</span>
                      {category.max_amount && (
                        <span className="text-xs text-gray-500">
                          Max: ${category.max_amount.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.categoryId && (
              <p className="text-sm text-red-600">{errors.categoryId.message}</p>
            )}
            {selectedCategory && selectedCategory.description && (
              <p className="text-sm text-gray-600">{selectedCategory.description}</p>
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Title *
            </Label>
            <Input
              id="title"
              {...register("title")}
              placeholder="Enter expense title"
              className={errors.title ? "border-red-500" : ""}
            />
            {errors.title && (
              <p className="text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Provide detailed description of the expense"
              rows={3}
              className={errors.description ? "border-red-500" : ""}
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          {/* Amount and Currency */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Amount *
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                {...register("amount", { valueAsNumber: true })}
                placeholder="0.00"
                className={errors.amount ? "border-red-500" : ""}
              />
              {errors.amount && (
                <p className="text-sm text-red-600">{errors.amount.message}</p>
              )}
              {selectedCategory && selectedCategory.max_amount && (
                <p className="text-xs text-gray-500">
                  Maximum allowed: ${selectedCategory.max_amount.toFixed(2)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select onValueChange={(value) => setValue("currency", value)} defaultValue="USD">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD - US Dollar</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                  <SelectItem value="GBP">GBP - British Pound</SelectItem>
                  <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Expense Date */}
          <div className="space-y-2">
            <Label htmlFor="expenseDate" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Expense Date *
            </Label>
            <Input
              id="expenseDate"
              type="date"
              {...register("expenseDate")}
              max={new Date().toISOString().split('T')[0]}
              className={errors.expenseDate ? "border-red-500" : ""}
            />
            {errors.expenseDate && (
              <p className="text-sm text-red-600">{errors.expenseDate.message}</p>
            )}
          </div>

          {/* Receipt URL */}
          <div className="space-y-2">
            <Label htmlFor="receiptUrl">Receipt URL (Optional)</Label>
            <Input
              id="receiptUrl"
              type="url"
              {...register("receiptUrl")}
              placeholder="https://example.com/receipt.pdf"
              className={errors.receiptUrl ? "border-red-500" : ""}
            />
            {errors.receiptUrl && (
              <p className="text-sm text-red-600">{errors.receiptUrl.message}</p>
            )}
            {selectedCategory && selectedCategory.requires_receipt && (
              <p className="text-xs text-amber-600">
                Receipt is required for this category
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Expense"
              )}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
