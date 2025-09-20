export declare const mockFn: <T = any>(returnValue?: T) => import("jest-mock").Mock<() => Promise<Awaited<T>>>;
export declare const createMockCollector: () => {
    on: import("jest-mock").Mock<(event: string, handler: Function) => void>;
    emit: (event: string, ...args: any[]) => void;
    stop: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
};
export declare const createMockGuild: () => {
    id: string;
    name: string;
    iconURL: import("jest-mock").Mock<() => string>;
};
export declare const createMockMessage: () => {
    id: string;
    url: string;
    embeds: any[];
    edit: import("jest-mock").Mock<() => Promise<boolean>>;
    react: import("jest-mock").Mock<() => Promise<boolean>>;
    createReactionCollector: import("jest-mock").Mock<() => {
        on: import("jest-mock").Mock<(event: string, handler: Function) => void>;
        emit: (event: string, ...args: any[]) => void;
        stop: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    }>;
};
export declare const createMockChannel: (guild: any, message: any) => {
    id: string;
    guild: any;
    send: import("jest-mock").Mock<() => Promise<any>>;
    messages: {
        fetch: import("jest-mock").Mock<() => Promise<any>>;
    };
};
export declare const createMockClient: (channel: any) => {
    channels: {
        cache: Map<string, any>;
    };
};
//# sourceMappingURL=utils.d.ts.map