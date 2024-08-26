export const isInt = (number: string) => {
    if (!/^["|']{0,1}[-]{0,1}\d{0,}(\.{0,1}\d+)["|']{0,1}$/.test(number)) return false;
    return !(number as any - parseInt(number));
}

export const isFloat = (number: string) => {
    if (!/^["|']{0,1}[-]{0,1}\d{0,}(\.{0,1}\d+)["|']{0,1}$/.test(number)) return false;
    return number as any - parseInt(number) ? true : false;
}