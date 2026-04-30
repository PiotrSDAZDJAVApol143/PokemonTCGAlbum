package org.example.pokemontcgalbum.service;

import org.example.pokemontcgalbum.dto.ImagePreloadResultDto;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

import jakarta.annotation.PostConstruct;
import org.example.pokemontcgalbum.dto.ImageCacheStatsDto;
import org.example.pokemontcgalbum.model.TcgCard;
import org.example.pokemontcgalbum.repository.TcgCardRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.io.OutputStream;
import java.util.Properties;
import java.util.stream.Stream;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageOutputStream;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Duration;
import java.util.Iterator;
import java.util.Locale;
import java.util.Optional;

@Service
public class CardImageCacheService {

    private static final float JPG_QUALITY = 0.88f;

    private static final String SETTINGS_FILE_NAME = "image-cache.properties";
    private static final String CACHE_DIR_PROPERTY = "cacheDir";

    private final TcgCardRepository cardRepository;

    @Value("${pokemon.images.cache-dir:}")
    private String configuredCacheDir;

    private Path cacheDir;
    private Path settingsFile;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .followRedirects(HttpClient.Redirect.NORMAL)
            .build();

    public CardImageCacheService(TcgCardRepository cardRepository) {
        this.cardRepository = cardRepository;
    }

    @PostConstruct
    public void init() throws IOException {
        Path configDir = Paths.get(
                System.getProperty("user.home"),
                "PokemonTCGAlbum",
                "config"
        );
        Files.createDirectories(configDir);

        this.settingsFile = configDir.resolve(SETTINGS_FILE_NAME);

        Path defaultDir;

        if (configuredCacheDir == null || configuredCacheDir.isBlank()) {
            defaultDir = Paths.get(
                    System.getProperty("user.home"),
                    "PokemonTCGAlbum",
                    "cache",
                    "images",
                    "cards"
            );
        } else {
            defaultDir = Paths.get(configuredCacheDir);
        }

        this.cacheDir = readSavedCacheDir().orElse(defaultDir).toAbsolutePath().normalize();

        Files.createDirectories(this.cacheDir);

        System.out.println("Card image cache directory: " + this.cacheDir.toAbsolutePath());
        System.out.println("Card image cache format: JPG, quality=" + JPG_QUALITY);
    }

    private Optional<Path> readSavedCacheDir() {
        if (settingsFile == null || !Files.exists(settingsFile)) {
            return Optional.empty();
        }

        Properties properties = new Properties();

        try (InputStream inputStream = Files.newInputStream(settingsFile)) {
            properties.load(inputStream);

            String savedDir = properties.getProperty(CACHE_DIR_PROPERTY);

            if (savedDir == null || savedDir.isBlank()) {
                return Optional.empty();
            }

            return Optional.of(Paths.get(savedDir));
        } catch (Exception e) {
            System.err.println("Cannot read image cache settings: " + e.getMessage());
            return Optional.empty();
        }
    }

    private void saveCacheDir(Path newCacheDir) throws IOException {
        if (settingsFile == null) {
            throw new IOException("Settings file is not initialized");
        }

        Files.createDirectories(settingsFile.getParent());

        Properties properties = new Properties();
        properties.setProperty(CACHE_DIR_PROPERTY, newCacheDir.toAbsolutePath().normalize().toString());

        try (OutputStream outputStream = Files.newOutputStream(settingsFile)) {
            properties.store(outputStream, "Pokemon TCG Album image cache settings");
        }
    }

    public synchronized ImageCacheStatsDto getCacheStats() {
        try {
            Files.createDirectories(cacheDir);

            long[] stats = new long[]{0L, 0L};

            try (Stream<Path> stream = Files.list(cacheDir)) {
                stream
                        .filter(Files::isRegularFile)
                        .filter(this::isImageCacheFile)
                        .forEach(path -> {
                            stats[0]++;
                            try {
                                stats[1] += Files.size(path);
                            } catch (IOException ignored) {
                            }
                        });
            }

            long totalBytes = stats[1];
            double totalMb = Math.round((totalBytes / 1024.0 / 1024.0) * 100.0) / 100.0;

            return new ImageCacheStatsDto(
                    cacheDir.toAbsolutePath().normalize().toString(),
                    stats[0],
                    totalBytes,
                    totalMb
            );
        } catch (Exception e) {
            throw new RuntimeException("Cannot calculate image cache stats: " + e.getMessage(), e);
        }
    }
    public synchronized ImagePreloadResultDto preloadCardImages(
            List<String> cardIds,
            boolean includeSmall,
            boolean includeLarge
    ) {
        if (cardIds == null || cardIds.isEmpty()) {
            return new ImagePreloadResultDto(
                    0,
                    0,
                    0,
                    0,
                    List.of(),
                    getCacheStats()
            );
        }

        Set<String> uniqueCardIds = new LinkedHashSet<>();

        for (String cardId : cardIds) {
            if (cardId != null && !cardId.isBlank()) {
                uniqueCardIds.add(cardId.trim());
            }
        }

        int requestedImages = 0;
        int successImages = 0;
        int failedImages = 0;

        List<String> failedCardIds = new ArrayList<>();

        for (String cardId : uniqueCardIds) {
            boolean cardFailed = false;

            if (includeSmall) {
                requestedImages++;

                if (getCardImage(cardId, "small").isPresent()) {
                    successImages++;
                } else {
                    failedImages++;
                    cardFailed = true;
                }
            }

            if (includeLarge) {
                requestedImages++;

                if (getCardImage(cardId, "large").isPresent()) {
                    successImages++;
                } else {
                    failedImages++;
                    cardFailed = true;
                }
            }

            if (cardFailed) {
                failedCardIds.add(cardId);
            }
        }

        return new ImagePreloadResultDto(
                uniqueCardIds.size(),
                requestedImages,
                successImages,
                failedImages,
                failedCardIds,
                getCacheStats()
        );
    }

    public synchronized ImageCacheStatsDto changeCacheDir(String newCacheDir) {
        if (newCacheDir == null || newCacheDir.trim().isBlank()) {
            throw new IllegalArgumentException("Cache directory cannot be empty");
        }

        try {
            Path newPath = Paths.get(newCacheDir.trim()).toAbsolutePath().normalize();

            if (isDangerousDirectory(newPath)) {
                throw new IllegalArgumentException("This directory is too broad/dangerous. Choose a dedicated cache folder.");
            }

            Files.createDirectories(newPath);

            if (!Files.isDirectory(newPath)) {
                throw new IllegalArgumentException("Selected path is not a directory");
            }

            if (!Files.isWritable(newPath)) {
                throw new IllegalArgumentException("Selected directory is not writable");
            }

            this.cacheDir = newPath;
            saveCacheDir(newPath);

            return getCacheStats();
        } catch (Exception e) {
            throw new RuntimeException("Cannot change image cache directory: " + e.getMessage(), e);
        }
    }

    public synchronized ImageCacheStatsDto clearCache() {
        try {
            Files.createDirectories(cacheDir);

            try (Stream<Path> stream = Files.list(cacheDir)) {
                stream
                        .filter(Files::isRegularFile)
                        .filter(this::isImageCacheFile)
                        .forEach(path -> {
                            try {
                                Files.deleteIfExists(path);
                            } catch (IOException e) {
                                System.err.println("Cannot delete cached image: " + path + " -> " + e.getMessage());
                            }
                        });
            }

            return getCacheStats();
        } catch (Exception e) {
            throw new RuntimeException("Cannot clear image cache: " + e.getMessage(), e);
        }
    }

    private boolean isImageCacheFile(Path path) {
        if (path == null || path.getFileName() == null) {
            return false;
        }

        String name = path.getFileName().toString().toLowerCase(Locale.ROOT);

        return name.endsWith(".jpg")
                || name.endsWith(".jpeg")
                || name.endsWith(".png")
                || name.endsWith(".webp")
                || name.endsWith(".gif");
    }

    private boolean isDangerousDirectory(Path path) {
        if (path == null) {
            return true;
        }

        Path normalized = path.toAbsolutePath().normalize();
        Path root = normalized.getRoot();

        if (root != null && normalized.equals(root)) {
            return true;
        }

        Path userHome = Paths.get(System.getProperty("user.home")).toAbsolutePath().normalize();

        return normalized.equals(userHome);
    }

    public Optional<CachedCardImage> getCardImage(String cardId, String requestedSize) {
        String size = normalizeSize(requestedSize);
        String safeCardId = safeFilePart(cardId);

        Optional<Path> existingFile = findExistingCachedFileAndConvertIfNeeded(safeCardId, size);
        if (existingFile.isPresent()) {
            Path path = existingFile.get();
            return Optional.of(new CachedCardImage(path, mediaTypeFor(path)));
        }

        Optional<TcgCard> cardOpt = cardRepository.findById(cardId);
        if (cardOpt.isEmpty()) {
            return Optional.empty();
        }

        TcgCard card = cardOpt.get();
        String imageUrl = pickImageUrl(card, size);

        if (imageUrl == null || imageUrl.isBlank()) {
            return Optional.empty();
        }

        try {
            Path downloaded = downloadAndConvertToJpg(imageUrl, safeCardId, size);
            return Optional.of(new CachedCardImage(downloaded, MediaType.IMAGE_JPEG));
        } catch (Exception e) {
            System.err.println("Cannot download/convert image for card " + cardId + ": " + e.getMessage());
            return Optional.empty();
        }
    }

    private String normalizeSize(String requestedSize) {
        if ("large".equalsIgnoreCase(requestedSize)) {
            return "large";
        }
        return "small";
    }

    private String pickImageUrl(TcgCard card, String size) {
        if ("large".equals(size)) {
            if (card.getImageUrlLarge() != null && !card.getImageUrlLarge().isBlank()) {
                return card.getImageUrlLarge();
            }
            return card.getImageUrlSmall();
        }

        if (card.getImageUrlSmall() != null && !card.getImageUrlSmall().isBlank()) {
            return card.getImageUrlSmall();
        }

        return card.getImageUrlLarge();
    }

    /**
     * Kolejność:
     * 1. szukamy JPG,
     * 2. szukamy JPEG,
     * 3. jeśli jest stare PNG, próbujemy przekonwertować je na JPG,
     * 4. jeśli konwersja PNG się nie uda, zwracamy PNG.
     */
    private Optional<Path> findExistingCachedFileAndConvertIfNeeded(String safeCardId, String size) {
        Path jpg = cacheDir.resolve(safeCardId + "_" + size + ".jpg");
        if (Files.exists(jpg) && Files.isRegularFile(jpg)) {
            return Optional.of(jpg);
        }

        Path jpeg = cacheDir.resolve(safeCardId + "_" + size + ".jpeg");
        if (Files.exists(jpeg) && Files.isRegularFile(jpeg)) {
            return Optional.of(jpeg);
        }

        Path png = cacheDir.resolve(safeCardId + "_" + size + ".png");
        if (Files.exists(png) && Files.isRegularFile(png)) {
            try {
                Path converted = convertExistingImageToJpg(png, safeCardId, size);
                return Optional.of(converted);
            } catch (Exception e) {
                System.err.println("Cannot convert existing PNG to JPG: " + png + " -> " + e.getMessage());
                return Optional.of(png);
            }
        }

        return Optional.empty();
    }

    private Path downloadAndConvertToJpg(String imageUrl, String safeCardId, String size)
            throws IOException, InterruptedException {

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(imageUrl))
                .timeout(Duration.ofSeconds(30))
                .GET()
                .build();

        HttpResponse<byte[]> response = httpClient.send(
                request,
                HttpResponse.BodyHandlers.ofByteArray()
        );

        int status = response.statusCode();
        if (status < 200 || status >= 300) {
            throw new IOException("HTTP status: " + status);
        }

        byte[] body = response.body();
        if (body == null || body.length == 0) {
            throw new IOException("Downloaded image is empty");
        }

        BufferedImage sourceImage = ImageIO.read(new ByteArrayInputStream(body));
        if (sourceImage == null) {
            throw new IOException("Cannot decode downloaded image");
        }

        Path target = cacheDir.resolve(safeCardId + "_" + size + ".jpg");
        writeAsJpg(sourceImage, target, JPG_QUALITY);

        return target;
    }

    private Path convertExistingImageToJpg(Path sourcePath, String safeCardId, String size) throws IOException {
        BufferedImage sourceImage = ImageIO.read(sourcePath.toFile());

        if (sourceImage == null) {
            throw new IOException("Cannot decode existing image: " + sourcePath);
        }

        Path target = cacheDir.resolve(safeCardId + "_" + size + ".jpg");
        writeAsJpg(sourceImage, target, JPG_QUALITY);

        return target;
    }

    /**
     * JPG nie obsługuje przezroczystości.
     * Dlatego tworzymy obraz RGB z białym tłem i dopiero na niego rysujemy źródło.
     */
    private void writeAsJpg(BufferedImage sourceImage, Path target, float quality) throws IOException {
        BufferedImage rgbImage = new BufferedImage(
                sourceImage.getWidth(),
                sourceImage.getHeight(),
                BufferedImage.TYPE_INT_RGB
        );

        Graphics2D graphics = rgbImage.createGraphics();
        graphics.setColor(Color.WHITE);
        graphics.fillRect(0, 0, rgbImage.getWidth(), rgbImage.getHeight());
        graphics.drawImage(sourceImage, 0, 0, null);
        graphics.dispose();

        Iterator<ImageWriter> writers = ImageIO.getImageWritersByFormatName("jpg");
        if (!writers.hasNext()) {
            throw new IOException("No JPG ImageWriter available");
        }

        ImageWriter writer = writers.next();

        try (OutputStream outputStream = Files.newOutputStream(target);
             ImageOutputStream imageOutputStream = ImageIO.createImageOutputStream(outputStream)) {

            writer.setOutput(imageOutputStream);

            ImageWriteParam params = writer.getDefaultWriteParam();

            if (params.canWriteCompressed()) {
                params.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
                params.setCompressionQuality(quality);
            }

            writer.write(null, new IIOImage(rgbImage, null, null), params);
        } finally {
            writer.dispose();
        }
    }

    private MediaType mediaTypeFor(Path path) {
        String name = path.getFileName().toString().toLowerCase(Locale.ROOT);

        if (name.endsWith(".jpg") || name.endsWith(".jpeg")) {
            return MediaType.IMAGE_JPEG;
        }

        if (name.endsWith(".png")) {
            return MediaType.IMAGE_PNG;
        }

        if (name.endsWith(".gif")) {
            return MediaType.IMAGE_GIF;
        }

        if (name.endsWith(".webp")) {
            return MediaType.parseMediaType("image/webp");
        }

        return MediaType.APPLICATION_OCTET_STREAM;
    }

    private String safeFilePart(String value) {
        if (value == null || value.isBlank()) {
            return "unknown";
        }

        return value.replaceAll("[^a-zA-Z0-9._-]", "_");
    }
    public synchronized Path saveImportedCardImage(String cardId, String requestedSize, byte[] imageBytes) {
        if (cardId == null || cardId.isBlank()) {
            throw new IllegalArgumentException("cardId is required");
        }

        if (imageBytes == null || imageBytes.length == 0) {
            throw new IllegalArgumentException("Image bytes are empty");
        }

        String size = normalizeSize(requestedSize);
        String safeCardId = safeFilePart(cardId);

        try {
            Files.createDirectories(cacheDir);

            BufferedImage sourceImage = ImageIO.read(new ByteArrayInputStream(imageBytes));

            if (sourceImage == null) {
                throw new IOException("Cannot decode imported image for card " + cardId);
            }

            Path target = cacheDir.resolve(safeCardId + "_" + size + ".jpg");

            writeAsJpg(sourceImage, target, JPG_QUALITY);

            return target;
        } catch (Exception e) {
            throw new RuntimeException("Cannot save imported card image: " + e.getMessage(), e);
        }
    }

    public static class CachedCardImage {
        private final Path path;
        private final MediaType mediaType;

        public CachedCardImage(Path path, MediaType mediaType) {
            this.path = path;
            this.mediaType = mediaType;
        }

        public Path getPath() {
            return path;
        }

        public MediaType getMediaType() {
            return mediaType;
        }
    }
}