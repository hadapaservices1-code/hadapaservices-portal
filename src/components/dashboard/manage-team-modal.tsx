"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Users, MoreVertical, Edit, Mail, Phone } from "lucide-react"

interface TeamMember {
  id: number
  name: string
  role: string
  status: "Online" | "Away" | "Offline"
  tasks: number
  completed: number
  email: string
  lastActive: string
}

interface ManageTeamModalProps {
  onTeamUpdated?: () => void
}

export function ManageTeamModal({ onTeamUpdated }: ManageTeamModalProps) {
  // onTeamUpdated callback for future use
  console.log("Team management modal opened", onTeamUpdated)
  const [isOpen, setIsOpen] = useState(false)
  const [teamMembers] = useState<TeamMember[]>([
    { id: 1, name: "Sarah Johnson", role: "Senior Developer", status: "Online", tasks: 8, completed: 6, email: "sarah@company.com", lastActive: "2 minutes ago" },
    { id: 2, name: "Mike Chen", role: "UI/UX Designer", status: "Away", tasks: 5, completed: 4, email: "mike@company.com", lastActive: "1 hour ago" },
    { id: 3, name: "Emily Davis", role: "Project Manager", status: "Online", tasks: 12, completed: 10, email: "emily@company.com", lastActive: "5 minutes ago" },
    { id: 4, name: "Alex Rodriguez", role: "Backend Developer", status: "Offline", tasks: 6, completed: 3, email: "alex@company.com", lastActive: "3 hours ago" },
  ])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Online":
        return "bg-green-100 text-green-800"
      case "Away":
        return "bg-yellow-100 text-yellow-800"
      case "Offline":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "Senior Developer":
        return "bg-blue-100 text-blue-800"
      case "UI/UX Designer":
        return "bg-purple-100 text-purple-800"
      case "Project Manager":
        return "bg-green-100 text-green-800"
      case "Backend Developer":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full mt-4" variant="outline">
          Manage Team
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Manage Team</span>
          </DialogTitle>
          <DialogDescription>
            View and manage your team members, their roles, and performance.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teamMembers.map((member) => (
              <Card key={member.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <CardTitle className="text-base">{member.name}</CardTitle>
                        <CardDescription className="text-sm">{member.email}</CardDescription>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge className={getRoleColor(member.role)}>
                        {member.role}
                      </Badge>
                      <Badge className={getStatusColor(member.status)}>
                        {member.status}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tasks Progress</span>
                        <span className="font-medium">{member.completed}/{member.tasks}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(member.completed / member.tasks) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="text-xs text-gray-500">
                      Last active: {member.lastActive}
                    </div>

                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Mail className="h-3 w-3 mr-1" />
                        Message
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Phone className="h-3 w-3 mr-1" />
                        Call
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-gray-600">
              {teamMembers.length} team members
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Close
              </Button>
              <Button>
                Add New Member
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
