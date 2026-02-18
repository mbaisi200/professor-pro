import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, hashPassword } from '@/lib/auth'
import { db } from '@/lib/db'

// GET - Get single user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    
    const { id } = await params
    
    // Admin can view any user, teachers can only view themselves
    if (user.role !== 'admin' && user.id !== id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }
    
    const targetUser = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        active: true,
        whatsappEnabled: true,
        twilioAccountSid: true,
        twilioPhoneNumber: true,
        // Never return twilioAuthToken for security
        createdAt: true,
        _count: {
          select: { students: true, classes: true }
        }
      }
    })
    
    if (!targetUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }
    
    return NextResponse.json({ user: targetUser })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json({ error: 'Erro ao buscar usuário' }, { status: 500 })
  }
}

// PUT - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    
    const { id } = await params
    
    // Admin can update any user, teachers can only update themselves
    if (user.role !== 'admin' && user.id !== id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }
    
    const body = await request.json()
    const { 
      name, 
      phone, 
      active, 
      password,
      // Twilio settings (each teacher configures their own)
      twilioAccountSid,
      twilioAuthToken,
      twilioPhoneNumber,
      whatsappEnabled
    } = body
    
    const updateData: Record<string, unknown> = {}
    
    if (name !== undefined) updateData.name = name.trim()
    if (phone !== undefined) updateData.phone = phone?.replace(/\D/g, '') || null
    if (password) updateData.password = await hashPassword(password)
    
    // Only admin can change active status
    if (active !== undefined && user.role === 'admin') {
      updateData.active = active
    }
    
    // Twilio settings - each teacher configures their own
    if (twilioAccountSid !== undefined) {
      updateData.twilioAccountSid = twilioAccountSid?.trim() || null
    }
    if (twilioAuthToken !== undefined) {
      updateData.twilioAuthToken = twilioAuthToken?.trim() || null
    }
    if (twilioPhoneNumber !== undefined) {
      updateData.twilioPhoneNumber = twilioPhoneNumber?.trim() || null
    }
    if (whatsappEnabled !== undefined) {
      updateData.whatsappEnabled = whatsappEnabled
    }
    
    const updatedUser = await db.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        active: true,
        whatsappEnabled: true,
        twilioAccountSid: true,
        twilioPhoneNumber: true
      }
    })
    
    return NextResponse.json({ success: true, user: updatedUser })
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json({ error: 'Erro ao atualizar usuário' }, { status: 500 })
  }
}

// DELETE - Delete user (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }
    
    const { id } = await params
    
    // Prevent deleting yourself
    if (user.id === id) {
      return NextResponse.json({ error: 'Não é possível excluir seu próprio usuário' }, { status: 400 })
    }
    
    await db.user.delete({
      where: { id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json({ error: 'Erro ao excluir usuário' }, { status: 500 })
  }
}
