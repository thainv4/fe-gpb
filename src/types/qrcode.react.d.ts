declare module 'qrcode.react' {
    import { Component } from 'react';

    export interface QRCodeProps {
        value: string;
        size?: number;
        level?: 'L' | 'M' | 'Q' | 'H';
        includeMargin?: boolean;
        marginSize?: number;
        bgColor?: string;
        fgColor?: string;
        imageSettings?: {
            src: string;
            height: number;
            width: number;
            excavate: boolean;
        };
    }

    export class QRCodeSVG extends Component<QRCodeProps> {}
    export class QRCodeCanvas extends Component<QRCodeProps> {}
}
