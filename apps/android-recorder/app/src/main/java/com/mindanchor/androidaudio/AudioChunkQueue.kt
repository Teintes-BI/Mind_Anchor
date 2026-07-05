package com.mindanchor.androidaudio

import android.content.Context
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.File
import java.util.UUID

class AudioChunkQueue(context: Context) {
    private val queueDir = File(context.filesDir, "audio_chunk_queue").apply { mkdirs() }
    private val maxQueuedFiles = 720

    suspend fun enqueue(chunk: AudioChunkPayload) = withContext(Dispatchers.IO) {
        val file = File(queueDir, "${chunk.sequence}-${UUID.randomUUID()}.json")
        file.writeText(
            JSONObject()
                .put("sessionId", chunk.sessionId)
                .put("deviceId", chunk.deviceId)
                .put("sequence", chunk.sequence)
                .put("startedAt", chunk.startedAt)
                .put("endedAt", chunk.endedAt)
                .put("durationMs", chunk.durationMs)
                .put("encoding", chunk.encoding)
                .put("checksum", chunk.checksum)
                .put("base64Audio", chunk.base64Audio)
                .put("rms", chunk.rms)
                .put("peak", chunk.peak)
                .put("replayed", chunk.replayed)
                .toString(),
        )

        val files = queueDir.listFiles()?.sortedBy { it.lastModified() }.orEmpty()
        if (files.size > maxQueuedFiles) {
            files.take(files.size - maxQueuedFiles).forEach(File::delete)
        }
    }

    suspend fun drain(processor: suspend (AudioChunkPayload) -> Unit): Int = withContext(Dispatchers.IO) {
        var processed = 0
        val files = queueDir.listFiles()?.sortedBy { it.lastModified() }.orEmpty()
        for (file in files) {
            val json = JSONObject(file.readText())
            val payload = AudioChunkPayload(
                sessionId = json.getString("sessionId"),
                deviceId = json.getString("deviceId"),
                sequence = json.getInt("sequence"),
                startedAt = json.getString("startedAt"),
                endedAt = json.getString("endedAt"),
                durationMs = json.getInt("durationMs"),
                encoding = json.getString("encoding"),
                checksum = json.getString("checksum"),
                base64Audio = json.getString("base64Audio"),
                rms = json.getDouble("rms"),
                peak = json.getDouble("peak"),
                replayed = true,
            )
            processor(payload)
            file.delete()
            processed += 1
        }
        processed
    }
}

