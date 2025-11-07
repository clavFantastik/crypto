export enum CipherMode {
    ECB = 'ECB',
    CBC = 'CBC', 
    PCBC = 'PCBC',
    CFB = 'CFB',
    OFB = 'OFB',
    CTR = 'CTR',
    RandomDelta = 'RandomDelta'
}

export enum PaddingMode {
    Zeros = 'Zeros',
    ANSI_X923 = 'ANSI_X923',
    PKCS7 = 'PKCS7',
    ISO_10126 = 'ISO_10126',
    NONE = 'NONE'
}