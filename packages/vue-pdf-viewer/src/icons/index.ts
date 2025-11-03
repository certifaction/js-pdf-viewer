export interface Icon {
    svgPath?: string
    svgCode?: string
    width?: number
    height?: number
}

export const iconPlus: Icon = {
    svgPath: 'M11 19v-6H5v-2h6V5h2v6h6v2h-6v6h-2z',
}
export const iconMinus: Icon = {
    svgPath: 'M5 13v-2h14v2H5z',
}
export const iconFit: Icon = {
    svgPath:
        'M5 21c-.55 0-1.021-.196-1.412-.587S3 19.55 3 19v-4h2v4h4v2H5zm10 0v-2h4v-4h2v4c0 .55-.196 1.021-.587 1.413S19.55 21 19 21h-4zM3 9V5c0-.55.196-1.021.587-1.412S4.45 3 5 3h4v2H5v4H3zm16 0V5h-4V3h4c.55 0 1.021.196 1.413.587S21 4.45 21 5v4h-2z',
}
