import { put, del } from '@vercel/blob'
import sharp from 'sharp'
import { prisma } from '@/lib/db'
import { apiError } from '@/lib/utils'

const MAX_SIZE = 2 * 1024 * 1024 // 2MB
const MAX_DIMENSION = 2000
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp']

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params
    const id = parseInt(rawId)

    const team = await prisma.team.findUnique({ where: { id } })
    if (!team) return apiError('Team not found', 404)

    const formData = await req.formData()
    const file = formData.get('file')

    if (!file || !(file instanceof File)) {
      return apiError('No file provided', 400)
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return apiError('Only PNG, JPEG, or WebP images are allowed', 400)
    }

    if (file.size > MAX_SIZE) {
      return apiError('Image must be under 2MB', 400)
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    let metadata
    try {
      metadata = await sharp(buffer).metadata()
    } catch {
      return apiError('Could not read image file', 400)
    }

    const { width, height } = metadata
    if (!width || !height) {
      return apiError('Could not determine image dimensions', 400)
    }

    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
      return apiError(
        `Image dimensions must not exceed ${MAX_DIMENSION}x${MAX_DIMENSION}px`,
        400
      )
    }

    const ext =
      file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
    const pathname = `teams/${id}/logo-${Date.now()}.${ext}`

    const blob = await put(pathname, buffer, {
      access: 'public',
      contentType: file.type,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    const previousLogoUrl = team.logoUrl

    const updated = await prisma.team.update({
      where: { id },
      data: { logoUrl: blob.url },
    })

    if (previousLogoUrl) {
      try {
        await del(previousLogoUrl, {
          token: process.env.BLOB_READ_WRITE_TOKEN,
        })
      } catch {
        // Old blob cleanup failure shouldn't fail the request
      }
    }

    return Response.json(updated)
} catch (err) {
  console.error('Logo upload error:', err)
  return apiError('Failed to upload logo', 500)
}
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params
    const id = parseInt(rawId)

    const team = await prisma.team.findUnique({ where: { id } })
    if (!team) return apiError('Team not found', 404)

    if (team.logoUrl) {
      try {
        await del(team.logoUrl)
      } catch {
        // Ignore blob deletion failures
      }
    }

    const updated = await prisma.team.update({
      where: { id },
      data: { logoUrl: null },
    })

    return Response.json(updated)
  } catch {
    return apiError('Failed to remove logo', 500)
  }
}