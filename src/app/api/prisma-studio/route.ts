import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'

let prismaStudioProcess: any = null

export async function POST(request: NextRequest) {
  try {
    const { action, port = 5555 } = await request.json()

    if (action === 'start') {
      if (prismaStudioProcess && !prismaStudioProcess.killed) {
        return NextResponse.json({
          success: true,
          message: 'Prisma Studio is already running',
          port,
          url: `http://localhost:${port}`
        })
      }

      try {
        console.log('Starting Prisma Studio on port', port)
        
        // Use cmd.exe on Windows to run npm command
        prismaStudioProcess = spawn('cmd.exe', ['/c', 'npm', 'run', 'db:studio', '--', '--port', port.toString()], {
          detached: false,
          stdio: 'pipe',
          cwd: process.cwd(),
          env: process.env
        })

        prismaStudioProcess.on('error', (error: Error) => {
          console.error('Prisma Studio process error:', error)
          prismaStudioProcess = null
        })

        prismaStudioProcess.on('exit', (code: number) => {
          console.log(`Prisma Studio process exited with code ${code}`)
          prismaStudioProcess = null
        })

        if (prismaStudioProcess.stdout) {
          prismaStudioProcess.stdout.on('data', (data: Buffer) => {
            console.log('Prisma Studio stdout:', data.toString())
          })
        }

        if (prismaStudioProcess.stderr) {
          prismaStudioProcess.stderr.on('data', (data: Buffer) => {
            console.log('Prisma Studio stderr:', data.toString())
          })
        }

        await new Promise(resolve => setTimeout(resolve, 4000))

        if (prismaStudioProcess && !prismaStudioProcess.killed) {
          return NextResponse.json({
            success: true,
            message: `Prisma Studio started on port ${port}`,
            port,
            url: `http://localhost:${port}`,
            pid: prismaStudioProcess.pid
          })
        } else {
          return NextResponse.json({
            success: false,
            error: 'Prisma Studio failed to start'
          }, { status: 500 })
        }
      } catch (error) {
        return NextResponse.json({
          success: false,
          error: 'Failed to start Prisma Studio',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
      }
    }

    if (action === 'stop') {
      if (prismaStudioProcess && !prismaStudioProcess.killed) {
        spawn('taskkill', ['/pid', prismaStudioProcess.pid.toString(), '/t', '/f'], { stdio: 'ignore' })
        prismaStudioProcess = null
        return NextResponse.json({
          success: true,
          message: 'Prisma Studio stopped'
        })
      } else {
        return NextResponse.json({
          success: true,
          message: 'Prisma Studio was not running'
        })
      }
    }

    if (action === 'status') {
      const isRunning = prismaStudioProcess && !prismaStudioProcess.killed
      return NextResponse.json({
        success: true,
        isRunning,
        port: isRunning ? port : null,
        url: isRunning ? `http://localhost:${port}` : null,
        pid: isRunning ? prismaStudioProcess.pid : null
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action'
    }, { status: 400 })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

export async function GET() {
  const isRunning = prismaStudioProcess && !prismaStudioProcess.killed
  
  return NextResponse.json({
    success: true,
    isRunning,
    port: isRunning ? 5555 : null,
    url: isRunning ? 'http://localhost:5555' : null,
    pid: isRunning ? prismaStudioProcess.pid : null
  })
} 