import type { TraceLogEvent } from "@mindanchor/domain";
import type { MindAnchorStore } from "../store.js";

type LoggerSink = {
  info(payload: Record<string, unknown>, message?: string): void;
  warn(payload: Record<string, unknown>, message?: string): void;
  error(payload: Record<string, unknown>, message?: string): void;
  child?(bindings: Record<string, unknown>): LoggerSink;
};

const noopSink: LoggerSink = {
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
  child: () => noopSink,
};

export class MindAnchorTraceLogger {
  private readonly sink: LoggerSink;

  constructor(
    private readonly store: MindAnchorStore,
    sink?: LoggerSink,
    private readonly component = "mindanchor",
  ) {
    this.sink = sink?.child ? sink.child({ component }) : sink ?? noopSink;
  }

  child(component: string) {
    return new MindAnchorTraceLogger(this.store, this.sink, component);
  }

  async info(input: Omit<TraceLogEvent, "id" | "createdAt" | "level" | "component">) {
    return this.write("info", input);
  }

  async warn(input: Omit<TraceLogEvent, "id" | "createdAt" | "level" | "component">) {
    return this.write("warn", input);
  }

  async error(input: Omit<TraceLogEvent, "id" | "createdAt" | "level" | "component">) {
    return this.write("error", input);
  }

  private async write(
    level: TraceLogEvent["level"],
    input: Omit<TraceLogEvent, "id" | "createdAt" | "level" | "component">,
  ) {
    const event = await this.store.addTraceLogEvent({
      traceId: input.traceId,
      parentTraceId: input.parentTraceId,
      level,
      component: this.component,
      event: input.event,
      message: input.message,
      metadata: input.metadata,
    });

    this.sink[level](
      {
        traceId: event.traceId,
        parentTraceId: event.parentTraceId,
        event: event.event,
        component: event.component,
        ...event.metadata,
      },
      event.message,
    );

    return event;
  }
}
