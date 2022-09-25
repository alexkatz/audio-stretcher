const regex = /^(http(s)?:\/\/)?((w){3}.)?youtu(be|.be)?(\.com)?\/.+$/;

export const getIsValidYoutubeUrl = (url: string) => regex.test(url);
