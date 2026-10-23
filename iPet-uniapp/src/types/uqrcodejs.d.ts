declare module 'uqrcodejs' {
    interface UQRCodeOptions {
        data?: string
        size?: number
        margin?: number
        backgroundColor?: string
        foregroundColor?: string
        errorCorrectLevel?: number
        canvasContext?: any
    }

    class UQRCode {
        data: string
        size: number
        margin: number
        backgroundColor: string
        foregroundColor: string
        errorCorrectLevel: number
        canvasContext: any

        constructor(options?: UQRCodeOptions)

        make(): void
        draw(): void

        static errorCorrectLevel: {
            L: number
            M: number
            Q: number
            H: number
        }
    }

    export default UQRCode
}
