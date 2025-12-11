declare module 'captcha-mini' {
  interface CaptchaOptions {
    fontSize?: number
    fontFamily?: string[]
    lineWidth?: number
    lineNum?: number
    dotR?: number
    dotNum?: number
    preGroundColor?: [number, number]
    backGroundColor?: [number, number]
    fontStyle?: string
    length?: number
  }

  class Captcha {
    constructor(options?: CaptchaOptions)
    getText(): string
    getRandom(min: number, max: number): number
    getColor(colorRange: [number, number]): [number, number, number]
  }

  export default Captcha
}

