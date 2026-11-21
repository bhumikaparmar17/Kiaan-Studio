-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 16, 2026 at 10:12 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.1.25

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `kiaan_studio_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `ai_models`
--

CREATE TABLE `ai_models` (
  `id` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `type` enum('IMAGE','VIDEO') NOT NULL,
  `baseCreditCost` int(11) NOT NULL,
  `defaultSteps` int(11) NOT NULL,
  `recommendedCfg` decimal(3,1) NOT NULL,
  `vramRequiredGb` int(11) NOT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `ai_models`
--

INSERT INTO `ai_models` (`id`, `name`, `type`, `baseCreditCost`, `defaultSteps`, `recommendedCfg`, `vramRequiredGb`, `isActive`, `createdAt`, `updatedAt`) VALUES
('flux-1-dev', 'FLUX.1 Dev', 'IMAGE', 10, 28, 4.5, 16, 1, '2026-11-14 09:33:29.509', '2026-11-14 09:33:29.509'),
('flux-1-schnell', 'FLUX.1 Schnell', 'IMAGE', 5, 4, 3.5, 12, 1, '2026-11-14 09:33:29.504', '2026-11-16 08:31:51.760'),
('sd-xl-base', 'Stable Diffusion XL Base', 'IMAGE', 4, 30, 7.0, 10, 1, '2026-11-14 09:33:29.513', '2026-11-14 09:33:29.513'),
('wan-2.1-i2v', 'Wan 2.1 Image-to-Video', 'VIDEO', 30, 40, 6.0, 24, 1, '2026-11-14 09:33:29.521', '2026-11-14 09:33:29.521'),
('wan-2.1-t2v', 'Wan 2.1 Text-to-Video', 'VIDEO', 25, 35, 6.0, 24, 1, '2026-11-14 09:33:29.517', '2026-11-14 09:33:29.517');

-- --------------------------------------------------------

--
-- Table structure for table `api_keys`
--

CREATE TABLE `api_keys` (
  `id` varchar(36) NOT NULL,
  `userId` varchar(36) NOT NULL,
  `name` varchar(100) NOT NULL,
  `keyHash` varchar(255) NOT NULL,
  `lastUsedAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` varchar(36) NOT NULL,
  `actorId` varchar(36) NOT NULL,
  `action` varchar(64) NOT NULL,
  `targetEntity` varchar(64) NOT NULL,
  `targetId` varchar(64) DEFAULT NULL,
  `ipAddress` varchar(45) DEFAULT NULL,
  `diffJson` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`diffJson`)),
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `audit_logs`
--

INSERT INTO `audit_logs` (`id`, `actorId`, `action`, `targetEntity`, `targetId`, `ipAddress`, `diffJson`, `createdAt`) VALUES
('5861fd12-c2c6-43e4-a914-06c5fc0802eb', '9d1a366f-cd3b-4c97-9b69-a27e534040a8', 'UPDATE_INQUIRY_STATUS', 'EnterpriseInquiry', '681f9db1-f92b-4a1a-9648-4d1a0b2b2c04', NULL, '{\"previousStatus\":\"NEW\",\"newStatus\":\"CONTACTED\",\"notesUpdated\":true}', '2026-11-16 08:31:26.275'),
('595986d5-9ff5-47ee-b00c-6eea1cf7c264', 'dc8f2aed-8834-4cf5-95fd-5fbbba9a853c', 'UPDATE_INQUIRY_STATUS', 'EnterpriseInquiry', 'fb6ed61f-4371-4d6d-8461-34371d4dfee3', NULL, '{\"previousStatus\":\"NEW\",\"newStatus\":\"CONTACTED\",\"notesUpdated\":true}', '2026-11-16 07:02:08.448'),
('5ff2ae0b-37c6-435e-9d5c-a3bf6827e3e9', '58d29371-8614-484c-a367-9459e2049243', 'UPDATE_INQUIRY_STATUS', 'EnterpriseInquiry', '681f9db1-f92b-4a1a-9648-4d1a0b2b2c04', NULL, '{\"previousStatus\":\"CONTACTED\",\"newStatus\":\"CLOSED\",\"notesUpdated\":true}', '2026-11-16 08:33:35.301'),
('658c33fd-ce98-4e71-b67e-9640f8eda4cd', 'e388774b-84f2-43d9-a31f-0e01e83ee9a6', 'UPDATE_INQUIRY_STATUS', 'EnterpriseInquiry', 'e0accc7d-3480-461e-a9c4-f2cfb5a8f475', NULL, '{\"previousStatus\":\"NEW\",\"newStatus\":\"CONTACTED\",\"notesUpdated\":true}', '2026-11-16 07:36:25.385'),
('9dd7acf8-1e0a-4f8a-a823-dfe6967fc5fe', 'a99c88fb-01d4-4451-b132-1b54247ce848', 'UPDATE_INQUIRY_STATUS', 'EnterpriseInquiry', '40384166-dd34-47a3-93a3-5a6031828062', NULL, '{\"previousStatus\":\"NEW\",\"newStatus\":\"CONTACTED\",\"notesUpdated\":true}', '2026-11-16 07:56:42.178');

-- --------------------------------------------------------

--
-- Table structure for table `credit_transactions`
--

CREATE TABLE `credit_transactions` (
  `id` varchar(36) NOT NULL,
  `walletId` varchar(36) NOT NULL,
  `amount` int(11) NOT NULL,
  `type` enum('CREDIT','DEBIT','REFUND','BONUS','ADJUSTMENT') NOT NULL,
  `category` enum('IMAGE_GENERATION','VIDEO_GENERATION','PLAN_ALLOWANCE','TOPUP_PACK','ADMIN_GRANT','REFUND') NOT NULL,
  `description` varchar(255) NOT NULL,
  `referenceId` varchar(64) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `credit_wallets`
--

CREATE TABLE `credit_wallets` (
  `id` varchar(36) NOT NULL,
  `userId` varchar(36) NOT NULL,
  `balance` int(11) NOT NULL DEFAULT 25,
  `reservedBalance` int(11) NOT NULL DEFAULT 0,
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `credit_wallets`
--

INSERT INTO `credit_wallets` (`id`, `userId`, `balance`, `reservedBalance`, `updatedAt`) VALUES
('0235b656-834a-43af-bd35-7fe93f6563ad', '42175da0-c522-4b06-b3d1-eb148a1275ae', 250, 0, '2026-11-16 07:49:19.870'),
('14e9dada-0937-4d58-8cbb-892d58d398eb', '4e6b4823-7003-4705-8c6a-8f44682db496', 25, 0, '2026-11-16 07:02:08.332'),
('589a06ae-6541-4c35-b916-a7dd34a34a9a', '2ba872b4-47db-4d8f-97b4-aedb9eaffc11', 100000, 0, '2026-11-14 10:03:38.873'),
('645298aa-528e-4805-a945-b03ce699957d', '045802c4-5e3b-4d59-90f9-57c97feba1f3', 25, 0, '2026-11-16 08:31:26.185'),
('8bb08dd0-f94d-4d50-abe4-9852abf2f80b', 'b94134e6-c187-4d6d-a811-fd649d6da654', 25, 0, '2026-11-16 07:56:42.083'),
('8bfdc356-2e9d-45fe-80c4-9cf5aa863716', '9d1a366f-cd3b-4c97-9b69-a27e534040a8', 25, 0, '2026-11-16 08:31:25.309'),
('a5657de4-6a89-412a-b65a-b321f91028d1', 'a99c88fb-01d4-4451-b132-1b54247ce848', 25, 0, '2026-11-16 07:56:41.196'),
('b6e3ab54-6374-460e-9664-2c8c9653c896', '7ffdaed7-5413-4911-81b3-6e7bed5d7a2b', 25, 0, '2026-11-16 07:36:25.272'),
('ce7688fe-358f-44cc-ad4e-4f5b5114e6df', 'dc8f2aed-8834-4cf5-95fd-5fbbba9a853c', 25, 0, '2026-11-16 07:02:07.303'),
('d7f23f28-9c03-4a2b-8b63-421c1e24c0b2', 'e388774b-84f2-43d9-a31f-0e01e83ee9a6', 25, 0, '2026-11-16 07:36:24.405'),
('d8695674-bba9-4d03-8c54-3c7f8c7ba7cb', '58d29371-8614-484c-a367-9459e2049243', 99999, 0, '2026-11-16 07:49:20.293'),
('f402daf6-4cb8-48da-86b9-ef18f725b639', '2741b2d6-930e-4d86-89e6-40762634ee48', 25, 0, '2026-11-14 06:44:35.919');

-- --------------------------------------------------------

--
-- Table structure for table `download_records`
--

CREATE TABLE `download_records` (
  `id` varchar(36) NOT NULL,
  `userId` varchar(36) NOT NULL,
  `assetId` varchar(36) NOT NULL,
  `format` varchar(16) NOT NULL,
  `downloadedAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `enterprise_inquiries`
--

CREATE TABLE `enterprise_inquiries` (
  `id` varchar(36) NOT NULL,
  `fullName` varchar(120) NOT NULL,
  `email` varchar(191) NOT NULL,
  `companyName` varchar(191) NOT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `companySize` varchar(50) NOT NULL,
  `service` varchar(100) NOT NULL,
  `monthlyUsage` varchar(100) NOT NULL,
  `message` text NOT NULL,
  `status` enum('NEW','CONTACTED','CLOSED') NOT NULL DEFAULT 'NEW',
  `notes` text DEFAULT NULL,
  `ipAddress` varchar(45) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `userId` varchar(36) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `enterprise_inquiries`
--

INSERT INTO `enterprise_inquiries` (`id`, `fullName`, `email`, `companyName`, `phone`, `companySize`, `service`, `monthlyUsage`, `message`, `status`, `notes`, `ipAddress`, `createdAt`, `updatedAt`, `userId`) VALUES
('2d0ab8e9-c00b-46ff-9e45-af333cafa49a', 'jane', 'j@gmail.com', 'apex jane', '2323232562', '11-50', 'video', '25k-100k', 'sd sddddddddddddddddddddddd', 'NEW', NULL, '::1', '2026-11-16 07:41:45.239', '2026-11-16 07:41:45.239', NULL),
('40384166-dd34-47a3-93a3-5a6031828062', 'David Sterling', 'enterprise_test_1794815802091@testcompany.org', 'Sterling Visual FX', '+1 415-555-0199', '51-200', 'both', '100k+', 'We are evaluating deploying Kiaan Studio across our 80-artist animation studio with dedicated GPU workers.', 'CONTACTED', 'Scheduled discovery call with Lead Architect for Thursday 2pm.', '::1', '2026-11-16 07:56:42.113', '2026-11-16 07:56:42.170', 'b94134e6-c187-4d6d-a811-fd649d6da654'),
('681f9db1-f92b-4a1a-9648-4d1a0b2b2c04', 'David Sterling', 'enterprise_test_1794817886196@testcompany.org', 'Sterling Visual FX', '+1 415-555-0199', '51-200', 'both', '100k+', 'We are evaluating deploying Kiaan Studio across our 80-artist animation studio with dedicated GPU workers.', 'CLOSED', 'Scheduled discovery call with Lead Architect for Thursday 2pm.', '::1', '2026-11-16 08:31:26.211', '2026-11-16 08:33:35.288', '045802c4-5e3b-4d59-90f9-57c97feba1f3'),
('7010118b-8e7e-44b4-8b0e-d45d00d43427', 'vishal', 'vi@gmail.com', 'Avanya enterprises', '7897897897', '1-10', 'image', '<5k', 'dj dj dskd j ld', 'NEW', NULL, '::1', '2026-11-16 07:40:15.662', '2026-11-16 07:40:15.662', NULL),
('e0accc7d-3480-461e-a9c4-f2cfb5a8f475', 'David Sterling', 'enterprise_test_1794814585296@testcompany.org', 'Sterling Visual FX', '+1 415-555-0199', '51-200', 'both', '100k+', 'We are evaluating deploying Kiaan Studio across our 80-artist animation studio with dedicated GPU workers.', 'CONTACTED', 'Scheduled discovery call with Lead Architect for Thursday 2pm.', '::1', '2026-11-16 07:36:25.306', '2026-11-16 07:36:25.376', NULL),
('fb6ed61f-4371-4d6d-8461-34371d4dfee3', 'David Sterling', 'enterprise_test_1794812528344@testcompany.org', 'Sterling Visual FX', '+1 415-555-0199', '51-200', 'both', '100k+', 'We are evaluating deploying Kiaan Studio across our 80-artist animation studio with dedicated GPU workers.', 'CONTACTED', 'Scheduled discovery call with Lead Architect for Thursday 2pm.', '::1', '2026-11-16 07:02:08.357', '2026-11-16 07:02:08.441', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `generated_assets`
--

CREATE TABLE `generated_assets` (
  `id` varchar(36) NOT NULL,
  `jobId` varchar(36) NOT NULL,
  `userId` varchar(36) NOT NULL,
  `projectId` varchar(36) DEFAULT NULL,
  `mediaType` enum('IMAGE','VIDEO') NOT NULL,
  `storagePath` varchar(512) NOT NULL,
  `thumbnailPath` varchar(512) DEFAULT NULL,
  `fileSizeBytes` bigint(20) NOT NULL,
  `dimensions` varchar(32) NOT NULL,
  `isFavorite` tinyint(1) NOT NULL DEFAULT 0,
  `deletedAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `generation_jobs`
--

CREATE TABLE `generation_jobs` (
  `id` varchar(36) NOT NULL,
  `userId` varchar(36) NOT NULL,
  `type` enum('TEXT_TO_IMAGE','TEXT_TO_VIDEO','IMAGE_TO_IMAGE','IMAGE_EDITOR','IMAGE_TO_VIDEO') NOT NULL,
  `status` enum('PENDING','QUEUED','PROCESSING','COMPLETED','FAILED','CANCELED') NOT NULL DEFAULT 'PENDING',
  `modelId` varchar(50) NOT NULL,
  `prompt` text NOT NULL,
  `negativePrompt` text DEFAULT NULL,
  `parametersJson` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`parametersJson`)),
  `creditCost` int(11) NOT NULL,
  `workerNodeId` varchar(64) DEFAULT NULL,
  `executionTimeMs` int(11) DEFAULT NULL,
  `errorMessage` text DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `completedAt` datetime(3) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `gpu_nodes`
--

CREATE TABLE `gpu_nodes` (
  `id` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `ipAddress` varchar(45) NOT NULL,
  `gpuModel` varchar(100) NOT NULL,
  `totalVramGb` int(11) NOT NULL,
  `usedVramGb` int(11) NOT NULL DEFAULT 0,
  `status` enum('ONLINE','BUSY','DRAINING','OFFLINE') NOT NULL DEFAULT 'ONLINE',
  `lastHeartbeatAt` datetime(3) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `gpu_nodes`
--

INSERT INTO `gpu_nodes` (`id`, `name`, `ipAddress`, `gpuModel`, `totalVramGb`, `usedVramGb`, `status`, `lastHeartbeatAt`, `createdAt`) VALUES
('node-a100-primary', 'Primary Cluster Node A100', '10.0.0.101', 'NVIDIA A100-SXM4-80GB', 80, 14, 'ONLINE', '2026-11-14 09:33:29.426', '2026-11-14 09:33:29.427'),
('node-rtx4090-worker-01', 'Edge Worker Node RTX 4090 #1', '10.0.0.102', 'NVIDIA GeForce RTX 4090 24GB', 24, 14, 'BUSY', '2026-11-16 08:31:51.644', '2026-11-14 09:33:29.432');

-- --------------------------------------------------------

--
-- Table structure for table `invoices`
--

CREATE TABLE `invoices` (
  `id` varchar(36) NOT NULL,
  `userId` varchar(36) NOT NULL,
  `invoiceNumber` varchar(64) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `status` varchar(32) NOT NULL DEFAULT 'PAID',
  `description` varchar(255) NOT NULL,
  `receiptUrl` varchar(512) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `projects`
--

CREATE TABLE `projects` (
  `id` varchar(36) NOT NULL,
  `userId` varchar(36) NOT NULL,
  `name` varchar(120) NOT NULL,
  `client` varchar(120) DEFAULT NULL,
  `colorTag` varchar(30) NOT NULL DEFAULT 'cyan',
  `description` text DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `refresh_tokens`
--

CREATE TABLE `refresh_tokens` (
  `id` varchar(36) NOT NULL,
  `userId` varchar(36) NOT NULL,
  `tokenHash` varchar(255) NOT NULL,
  `expiresAt` datetime(3) NOT NULL,
  `revokedAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `refresh_tokens`
--

INSERT INTO `refresh_tokens` (`id`, `userId`, `tokenHash`, `expiresAt`, `revokedAt`, `createdAt`) VALUES
('00810f50-4253-486f-9093-c850b16474af', '58d29371-8614-484c-a367-9459e2049243', 'a40dd27f0f369e6fb9d6c1e82d5e5489e69e597bf43be206dd5a7277a951a5c8', '2026-11-23 07:49:35.414', NULL, '2026-11-16 07:49:35.416'),
('1267d973-7d67-4887-9edc-ea8679cc6612', '2ba872b4-47db-4d8f-97b4-aedb9eaffc11', '26edb539163422adc0911497e1016781680793f9d2132ae6b49bd659b7021457', '2026-11-23 07:00:50.349', NULL, '2026-11-16 07:00:50.350'),
('26dd769d-971c-4156-aa54-ad71ff615be5', '2741b2d6-930e-4d86-89e6-40762634ee48', '40cc13480dd1efeb5f428bc29d3f0ea5c8dce7fa69378ce5451c64c31af2dd17', '2026-11-23 04:53:48.280', '2026-11-16 04:53:58.345', '2026-11-16 04:53:48.289'),
('26f4d70c-78bc-4038-818a-83b77aaad63e', 'a99c88fb-01d4-4451-b132-1b54247ce848', 'd01535a4f3f42676f4089fa33f0b30a6a929c1fbd25cd19eb3dc0251457b7de1', '2026-11-23 07:56:41.206', NULL, '2026-11-16 07:56:41.207'),
('2cec02ee-7ff1-4271-a1e7-6b824d943930', 'e388774b-84f2-43d9-a31f-0e01e83ee9a6', '2490def14de7bb1fb823f75d01808dd9092a945c8dbe7494e2782576bd273952', '2026-11-23 07:36:24.858', NULL, '2026-11-16 07:36:24.860'),
('428241a8-b2b7-41f3-8252-59fd3443aa49', '9d1a366f-cd3b-4c97-9b69-a27e534040a8', '4b7920e9a7e46afc7e0c5d31ad5cb787edf6db376903945d2c00737f713c7445', '2026-11-23 08:31:25.771', NULL, '2026-11-16 08:31:25.772'),
('57264d82-2603-4472-8a7e-d6715f14753b', '2741b2d6-930e-4d86-89e6-40762634ee48', '47857d9dcb7b08e81e1d2d7325763dfb24dcc3466827552eda21ad4eb2f7176b', '2026-11-21 13:23:01.373', '2026-11-16 04:53:48.280', '2026-11-14 13:23:01.375'),
('62727aa5-d9ad-4e6e-9915-f5de51dbc36b', '2741b2d6-930e-4d86-89e6-40762634ee48', '3849776e5f5179a296f7da943945d5f15a2f2035d5885ea4fb915d6f85d1310f', '2026-11-21 11:46:22.500', '2026-11-14 13:23:01.373', '2026-11-14 11:46:22.504'),
('67d22d72-0293-4427-94f0-5102bcf53b1b', '58d29371-8614-484c-a367-9459e2049243', '72541540899d47a37f3c28ec01f8803b40a828f30c91676c45f2d7ab1a34a200', '2026-11-23 08:33:03.990', NULL, '2026-11-16 08:33:03.991'),
('6c308d36-1813-482c-a6e1-5fb8b00b7a77', '2741b2d6-930e-4d86-89e6-40762634ee48', '21a17243a8476354473a6b00d00f94fbae6f84d8a153de5ab81a16a2a43b9895', '2026-11-21 06:48:32.681', '2026-11-14 07:31:30.633', '2026-11-14 06:48:32.683'),
('749729c4-aa24-4610-86dd-ea7587289096', '7ffdaed7-5413-4911-81b3-6e7bed5d7a2b', '3dd5f98edd993e0990c936dd96ff07b3a36ecebeb97abce4722f4e7b49428354', '2026-11-23 07:36:25.285', NULL, '2026-11-16 07:36:25.286'),
('7b17b510-6964-4fe6-b9b6-85c32405fdc8', '2741b2d6-930e-4d86-89e6-40762634ee48', '78ee968757a98e83610124299b6e4fa98f732c335521e8eba5fa5de327c462a5', '2026-11-21 06:44:35.938', '2026-11-14 06:44:42.396', '2026-11-14 06:44:35.939'),
('7e451a29-46ea-4a29-bf0f-e070a311a323', '2741b2d6-930e-4d86-89e6-40762634ee48', '0ccfefa85824ec92c42bb59c92a7046223d27fa00b3199ccc0816cb34ebb761e', '2026-11-21 06:44:58.065', '2026-11-14 06:45:04.805', '2026-11-14 06:44:58.067'),
('81803a5c-54e2-4878-8dba-804fdf26578f', 'dc8f2aed-8834-4cf5-95fd-5fbbba9a853c', 'dae9ddb843d2f61b7333e370910eec0faf285ee15eaa8d12a0b70d9d095bbd84', '2026-11-23 07:02:07.893', NULL, '2026-11-16 07:02:07.895'),
('906bfaa2-f62a-47f6-8e67-07d2f5d73c1b', '045802c4-5e3b-4d59-90f9-57c97feba1f3', 'fd5116fb662627d978f09cfaa1bbfab2d92b26940bd5c84ae6c46ccc7a255ef9', '2026-11-23 08:31:26.187', NULL, '2026-11-16 08:31:26.188'),
('9305524f-e01f-4dc2-9046-03d3bad0fb19', 'dc8f2aed-8834-4cf5-95fd-5fbbba9a853c', 'af096794227170eaed244bf1b5625dfb5a14d2b8e7bf971a5de5a8183f913bdd', '2026-11-23 07:02:07.320', NULL, '2026-11-16 07:02:07.322'),
('982a7870-1ba2-4c0e-ae29-81af1d246c3e', 'a99c88fb-01d4-4451-b132-1b54247ce848', '43bd30589c90c513ddb4e06e185888df6d49529dd2b2c8fdfc516096b6e64e10', '2026-11-23 07:56:41.672', NULL, '2026-11-16 07:56:41.674'),
('9fc6a654-2453-4d6b-8dc4-4298aede1007', '4e6b4823-7003-4705-8c6a-8f44682db496', '0f27428fc131f800ad1990755c9b7117489a42a4b0324f40033d99e5c6e2ad14', '2026-11-23 07:02:08.337', NULL, '2026-11-16 07:02:08.339'),
('a86ca8bc-af3e-48a5-935d-da8340cb847f', '9d1a366f-cd3b-4c97-9b69-a27e534040a8', '7d8fd2a9cdfb28b8ef979029831e5794d8470dde4ca70d22057343abc4a3fd9b', '2026-11-23 08:31:25.315', NULL, '2026-11-16 08:31:25.316'),
('bd88d3e9-3067-440b-a59a-ce050ebdb448', '2741b2d6-930e-4d86-89e6-40762634ee48', 'acc13a4bb093f449dadc343ab48a6cac172546ed6e4e862bb593afff81aceac3', '2026-11-21 11:29:38.049', '2026-11-14 11:46:22.500', '2026-11-14 11:29:38.051'),
('c03e1409-fffe-4098-8002-9b6408e5bb33', 'e388774b-84f2-43d9-a31f-0e01e83ee9a6', '6ba726b8538b241c80f7b396aabaaed2f5404f4c0826823861a894e168eeaa69', '2026-11-23 07:36:24.408', NULL, '2026-11-16 07:36:24.409'),
('cdd8ea64-8e2b-4851-83a1-7fbf6248c7d8', '2741b2d6-930e-4d86-89e6-40762634ee48', '878a632adeef0659b0485d3b1e4988b0cf6bf3d4db18af84198e767ce0f8595e', '2026-11-23 05:16:39.967', '2026-11-16 05:18:50.544', '2026-11-16 05:16:39.971'),
('e830af32-6f95-4434-9402-454105d5e5d0', '2741b2d6-930e-4d86-89e6-40762634ee48', '954c240fba5d106f205acc06c6b000720848746728667396bd1a5a10ca5233b0', '2026-11-21 13:10:59.858', '2026-11-16 05:16:39.967', '2026-11-14 13:10:59.860'),
('ed0724d3-0a7c-4841-af92-e4d58a46afd8', 'b94134e6-c187-4d6d-a811-fd649d6da654', '4d5296fe731c03735fd67a3b21a991ee64dd6345039dbb724f4571ed89991f69', '2026-11-23 07:56:42.085', NULL, '2026-11-16 07:56:42.086');

-- --------------------------------------------------------

--
-- Table structure for table `subscriptions`
--

CREATE TABLE `subscriptions` (
  `id` varchar(36) NOT NULL,
  `userId` varchar(36) NOT NULL,
  `planId` varchar(36) NOT NULL,
  `status` enum('ACTIVE','PAST_DUE','CANCELED','TRIALING') NOT NULL DEFAULT 'ACTIVE',
  `currentPeriodStart` datetime(3) NOT NULL,
  `currentPeriodEnd` datetime(3) NOT NULL,
  `cancelAtPeriodEnd` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `subscription_plans`
--

CREATE TABLE `subscription_plans` (
  `id` varchar(36) NOT NULL,
  `slug` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `priceMonthly` decimal(10,2) NOT NULL,
  `priceAnnual` decimal(10,2) NOT NULL,
  `monthlyCredits` int(11) NOT NULL,
  `maxConcurrentJobs` int(11) NOT NULL DEFAULT 1,
  `featuresJson` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`featuresJson`)),
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `subscription_plans`
--

INSERT INTO `subscription_plans` (`id`, `slug`, `name`, `priceMonthly`, `priceAnnual`, `monthlyCredits`, `maxConcurrentJobs`, `featuresJson`, `isActive`, `createdAt`, `updatedAt`) VALUES
('4980261d-44b2-4121-93aa-39a223d59d6b', 'creator-pro', 'Creator Pro', 29.00, 290.00, 500, 2, '[\"500 monthly credits\",\"Priority GPU queue\",\"Commercial license\"]', 1, '2026-11-14 08:31:55.841', '2026-11-14 10:03:38.416'),
('9ba24fc0-7b18-46cf-91e0-e76c95fa82fd', 'free', 'Free Creator', 0.00, 0.00, 25, 1, '[\"25 welcome credits\",\"Standard queue\",\"Community support\"]', 1, '2026-11-14 08:31:55.833', '2026-11-14 10:03:38.368'),
('c7b75608-8564-4acb-a9dc-180e2a27bca1', 'studio-ultimate', 'Studio Ultimate', 99.00, 990.00, 2500, 5, '[\"2,500 monthly credits\",\"Dedicated GPU queue\",\"Full API access\"]', 1, '2026-11-14 08:31:55.851', '2026-11-14 10:03:38.422');

-- --------------------------------------------------------

--
-- Table structure for table `support_tickets`
--

CREATE TABLE `support_tickets` (
  `id` varchar(36) NOT NULL,
  `userId` varchar(36) NOT NULL,
  `category` varchar(64) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `priority` varchar(32) NOT NULL DEFAULT 'NORMAL',
  `status` varchar(32) NOT NULL DEFAULT 'OPEN',
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `system_settings`
--

CREATE TABLE `system_settings` (
  `id` varchar(36) NOT NULL,
  `key` varchar(100) NOT NULL,
  `value` text NOT NULL,
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `system_settings`
--

INSERT INTO `system_settings` (`id`, `key`, `value`, `updatedAt`) VALUES
('06f8992d-a369-4290-a4a2-9add4b2a47fb', 'user_prefs_c66467c0-1ea4-45ff-93ba-edcc0213a977', '{\"emailCompletedJobs\":true,\"emailLowCredits\":true,\"browserNotifications\":true,\"emailProductUpdates\":false,\"autoDownload\":false,\"theme\":\"dark\",\"defaultModel\":\"flux-1-schnell\",\"notifyOnComplete\":true}', '2026-11-16 05:49:04.152'),
('080ab89f-43ef-4035-be7c-a0eb1c65dd95', 'user_prefs_13d9075a-e15d-4f49-b8fe-9eed0cc5af66', '{\"emailCompletedJobs\":true,\"emailLowCredits\":true,\"browserNotifications\":true,\"emailProductUpdates\":false,\"autoDownload\":false,\"theme\":\"dark\",\"defaultModel\":\"flux-1-schnell\",\"notifyOnComplete\":true}', '2026-11-14 10:15:27.784'),
('0857e62b-1e6d-4841-bf2c-d1ecabf7d24c', 'user_prefs_3ef1b7ff-a486-43a3-91b1-7d2f05adbc80', '{\"emailCompletedJobs\":true,\"emailLowCredits\":true,\"browserNotifications\":true,\"emailProductUpdates\":false,\"autoDownload\":false,\"theme\":\"dark\",\"defaultModel\":\"flux-1-schnell\",\"notifyOnComplete\":true}', '2026-11-14 10:22:06.705'),
('334e661f-9d35-456a-ba72-7e82ad91652f', 'user_prefs_b898e09a-d6f2-42a9-8cae-d054bd864758', '{\"emailCompletedJobs\":true,\"emailLowCredits\":true,\"browserNotifications\":true,\"emailProductUpdates\":false,\"autoDownload\":false,\"theme\":\"dark\",\"defaultModel\":\"flux-1-schnell\",\"notifyOnComplete\":true}', '2026-11-16 08:31:51.265'),
('3fc361e6-b7b4-45b6-b0b4-c20b03f1c436', 'user_prefs_c303dae0-3848-49da-aa7f-08454abbe18a', '{\"emailCompletedJobs\":true,\"emailLowCredits\":true,\"browserNotifications\":true,\"emailProductUpdates\":false,\"autoDownload\":false,\"theme\":\"dark\",\"defaultModel\":\"flux-1-schnell\",\"notifyOnComplete\":true}', '2026-11-14 10:48:33.985'),
('4a24ede7-41ca-4f7a-b230-dc3e20d0424e', 'user_prefs_16fe4ed6-6b58-43eb-a06a-84c50b7a6ac8', '{\"emailCompletedJobs\":true,\"emailLowCredits\":true,\"browserNotifications\":true,\"emailProductUpdates\":false,\"autoDownload\":false,\"theme\":\"dark\",\"defaultModel\":\"flux-1-schnell\",\"notifyOnComplete\":true}', '2026-11-14 10:34:34.062'),
('4c9002f6-f318-4d1b-99d3-84271762c7d4', 'user_prefs_cf5bf3f6-e3c5-44af-90e7-de282023be9c', '{\"emailCompletedJobs\":true,\"emailLowCredits\":true,\"browserNotifications\":true,\"emailProductUpdates\":false,\"autoDownload\":false,\"theme\":\"dark\",\"defaultModel\":\"flux-1-schnell\",\"notifyOnComplete\":true}', '2026-11-16 07:02:48.688'),
('7537f288-eb6f-4643-aec5-5b5e23e0cc97', 'systemNotice', 'Cluster scheduled maintenance window verified', '2026-11-16 08:31:51.844'),
('96378f6c-6597-4141-b592-4f15b63621ef', 'user_prefs_6d984ab6-e5fe-42f0-82b5-e30211b6e5f3', '{\"emailCompletedJobs\":true,\"emailLowCredits\":true,\"browserNotifications\":true,\"emailProductUpdates\":false,\"autoDownload\":false,\"theme\":\"dark\",\"defaultModel\":\"flux-1-schnell\",\"notifyOnComplete\":true}', '2026-11-14 10:19:21.813'),
('ae2e0466-6fba-4955-a732-55d65d829baf', 'user_prefs_37ecd3b1-ddf9-4c19-95f7-4f61dcbcd6b9', '{\"emailCompletedJobs\":true,\"emailLowCredits\":true,\"browserNotifications\":true,\"emailProductUpdates\":false,\"autoDownload\":false,\"theme\":\"dark\",\"defaultModel\":\"flux-1-schnell\",\"notifyOnComplete\":true}', '2026-11-14 10:16:05.897'),
('d7b02eca-39b6-4f40-ad8a-640bea5e001e', 'user_prefs_097adc95-1b05-4ff2-837b-4d4998bf1a41', '{\"emailCompletedJobs\":true,\"emailLowCredits\":true,\"browserNotifications\":true,\"emailProductUpdates\":false,\"autoDownload\":false,\"theme\":\"dark\",\"defaultModel\":\"flux-1-schnell\",\"notifyOnComplete\":true}', '2026-11-14 10:29:51.899');

-- --------------------------------------------------------

--
-- Table structure for table `ticket_messages`
--

CREATE TABLE `ticket_messages` (
  `id` varchar(36) NOT NULL,
  `ticketId` varchar(36) NOT NULL,
  `senderId` varchar(36) NOT NULL,
  `message` text NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` varchar(36) NOT NULL,
  `email` varchar(255) NOT NULL,
  `passwordHash` varchar(255) NOT NULL,
  `fullName` varchar(100) NOT NULL,
  `role` enum('CREATOR','SUPPORT_AGENT','ADMIN','SUPER_ADMIN') NOT NULL DEFAULT 'CREATOR',
  `status` enum('ACTIVE','SUSPENDED','BANNED') NOT NULL DEFAULT 'ACTIVE',
  `avatarUrl` varchar(512) DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `passwordHash`, `fullName`, `role`, `status`, `avatarUrl`, `bio`, `createdAt`, `updatedAt`) VALUES
('045802c4-5e3b-4d59-90f9-57c97feba1f3', 'customer_test_1794817885777@studio.local', '$2b$12$GkWhgmm9SkOV.w7pTpfhKumulAqMeSF4eR7LsWs2D/PhX.DV6DtXu', 'Test Customer', 'CREATOR', 'ACTIVE', NULL, NULL, '2026-11-16 08:31:26.180', '2026-11-16 08:31:26.180'),
('2741b2d6-930e-4d86-89e6-40762634ee48', 'vishal@gmail.com', '$2b$12$2BR.72AbziLha0fA3zimgepHZp8SwDrMTfb/l.nNB7s6A1beQ4nUu', 'vishal', 'CREATOR', 'ACTIVE', NULL, NULL, '2026-11-14 06:44:35.914', '2026-11-14 06:44:35.914'),
('2ba872b4-47db-4d8f-97b4-aedb9eaffc11', 'admin@kiaanstudio.local', '$2b$12$xvLTBz6x.c949Bo7.Mws..UtrBwsSnvPTEIomhmngXdu0shwxdZsm', 'Platform Super Administrator', 'SUPER_ADMIN', 'ACTIVE', NULL, NULL, '2026-11-14 10:03:38.868', '2026-11-14 10:03:38.868'),
('42175da0-c522-4b06-b3d1-eb148a1275ae', 'user@gmail.com', '$2b$12$8yeKYC0I0.9sMGS4sMzFcu8Qec8DzCXDMm7Q63fGNq85qtUFdWxD2', 'Demo Creator', 'CREATOR', 'ACTIVE', NULL, NULL, '2026-11-16 07:49:19.867', '2026-11-16 07:49:19.867'),
('4e6b4823-7003-4705-8c6a-8f44682db496', 'customer_test_1794812527905@studio.local', '$2b$12$F4acN5wxSrhZC5gz8YaHWuTDt7S6QCxTFic/Tf7.L1oz6er68bYqW', 'Test Customer', 'CREATOR', 'ACTIVE', NULL, NULL, '2026-11-16 07:02:08.327', '2026-11-16 07:02:08.327'),
('58d29371-8614-484c-a367-9459e2049243', 'admin@gmail.com', '$2b$12$hNTIPr0sRd7OS9N.f5N0o.xJIAxgVH0xyX3rz9AYz0Dx4bNK8/j9W', 'System Administrator', 'SUPER_ADMIN', 'ACTIVE', NULL, NULL, '2026-11-16 07:49:20.287', '2026-11-16 07:49:20.287'),
('7ffdaed7-5413-4911-81b3-6e7bed5d7a2b', 'customer_test_1794814584864@studio.local', '$2b$12$9PjtBbMhgZOyAJHNEWDupuMgdJKUFFwlhCZ1Pszdb/s1aBsS.DdbW', 'Test Customer', 'CREATOR', 'ACTIVE', NULL, NULL, '2026-11-16 07:36:25.267', '2026-11-16 07:36:25.267'),
('9d1a366f-cd3b-4c97-9b69-a27e534040a8', 'admin_test_1794817884806@studio.local', '$2b$12$nop9AqqYv3UM4SjmBb1ZSud92wW.kHzFpCmIyaJZ0uFRKXiRYuFg6', 'Admin Tester', 'ADMIN', 'ACTIVE', NULL, NULL, '2026-11-16 08:31:25.305', '2026-11-16 08:31:25.351'),
('a99c88fb-01d4-4451-b132-1b54247ce848', 'admin_test_1794815800407@studio.local', '$2b$12$gL74HNwWQ.FGXk/OK9XPa.kS4qRhZCiP6mQK2ju3evPkrM..2w56e', 'Admin Tester', 'ADMIN', 'ACTIVE', NULL, NULL, '2026-11-16 07:56:41.186', '2026-11-16 07:56:41.246'),
('b94134e6-c187-4d6d-a811-fd649d6da654', 'customer_test_1794815801682@studio.local', '$2b$12$au9IX4M6qBvqte4S/eJeQ.38X.GPJBqrsiBFXKLFs6q/HgdTpWJr6', 'Test Customer', 'CREATOR', 'ACTIVE', NULL, NULL, '2026-11-16 07:56:42.076', '2026-11-16 07:56:42.076'),
('dc8f2aed-8834-4cf5-95fd-5fbbba9a853c', 'admin_test_1794812526587@studio.local', '$2b$12$XBAjBgiZDPO2Roue3SSQUexMt6jeYUZAz423bjcyVOSKH4Ld4ZXEu', 'Admin Tester', 'ADMIN', 'ACTIVE', NULL, NULL, '2026-11-16 07:02:07.297', '2026-11-16 07:02:07.371'),
('e388774b-84f2-43d9-a31f-0e01e83ee9a6', 'admin_test_1794814583901@studio.local', '$2b$12$PeXRGUOuH/KvyYQ.xTo6Fe2tCK20nRuNa5L2ZKoamq8U4iMhuCKpS', 'Admin Tester', 'ADMIN', 'ACTIVE', NULL, NULL, '2026-11-16 07:36:24.402', '2026-11-16 07:36:24.439');

-- --------------------------------------------------------

--
-- Table structure for table `_prisma_migrations`
--

CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) NOT NULL,
  `checksum` varchar(64) NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) NOT NULL,
  `logs` text DEFAULT NULL,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `applied_steps_count` int(10) UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `_prisma_migrations`
--

INSERT INTO `_prisma_migrations` (`id`, `checksum`, `finished_at`, `migration_name`, `logs`, `rolled_back_at`, `started_at`, `applied_steps_count`) VALUES
('6a22bc72-d36e-4be3-8d46-c99110a91921', '9069c496d020d8c6bda3893a8a0b0ca413a69a053634e15e1b94554c1d92f899', '2026-11-14 05:46:25.163', '20261114054623_init', NULL, NULL, '2026-11-14 05:46:23.805', 1);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `ai_models`
--
ALTER TABLE `ai_models`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `api_keys`
--
ALTER TABLE `api_keys`
  ADD PRIMARY KEY (`id`),
  ADD KEY `api_keys_userId_idx` (`userId`);

--
-- Indexes for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `audit_logs_createdAt_idx` (`createdAt`),
  ADD KEY `audit_logs_actorId_action_idx` (`actorId`,`action`);

--
-- Indexes for table `credit_transactions`
--
ALTER TABLE `credit_transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `credit_transactions_walletId_createdAt_idx` (`walletId`,`createdAt`);

--
-- Indexes for table `credit_wallets`
--
ALTER TABLE `credit_wallets`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `credit_wallets_userId_key` (`userId`);

--
-- Indexes for table `download_records`
--
ALTER TABLE `download_records`
  ADD PRIMARY KEY (`id`),
  ADD KEY `download_records_userId_downloadedAt_idx` (`userId`,`downloadedAt`),
  ADD KEY `download_records_assetId_fkey` (`assetId`);

--
-- Indexes for table `enterprise_inquiries`
--
ALTER TABLE `enterprise_inquiries`
  ADD PRIMARY KEY (`id`),
  ADD KEY `enterprise_inquiries_status_createdAt_idx` (`status`,`createdAt`),
  ADD KEY `enterprise_inquiries_email_idx` (`email`);

--
-- Indexes for table `generated_assets`
--
ALTER TABLE `generated_assets`
  ADD PRIMARY KEY (`id`),
  ADD KEY `generated_assets_userId_deletedAt_isFavorite_idx` (`userId`,`deletedAt`,`isFavorite`),
  ADD KEY `generated_assets_projectId_idx` (`projectId`),
  ADD KEY `generated_assets_jobId_fkey` (`jobId`);

--
-- Indexes for table `generation_jobs`
--
ALTER TABLE `generation_jobs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `generation_jobs_userId_createdAt_idx` (`userId`,`createdAt`),
  ADD KEY `generation_jobs_status_createdAt_idx` (`status`,`createdAt`);

--
-- Indexes for table `gpu_nodes`
--
ALTER TABLE `gpu_nodes`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `invoices`
--
ALTER TABLE `invoices`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `invoices_invoiceNumber_key` (`invoiceNumber`),
  ADD KEY `invoices_userId_idx` (`userId`);

--
-- Indexes for table `projects`
--
ALTER TABLE `projects`
  ADD PRIMARY KEY (`id`),
  ADD KEY `projects_userId_idx` (`userId`);

--
-- Indexes for table `refresh_tokens`
--
ALTER TABLE `refresh_tokens`
  ADD PRIMARY KEY (`id`),
  ADD KEY `refresh_tokens_userId_idx` (`userId`);

--
-- Indexes for table `subscriptions`
--
ALTER TABLE `subscriptions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `subscriptions_userId_idx` (`userId`),
  ADD KEY `subscriptions_planId_idx` (`planId`);

--
-- Indexes for table `subscription_plans`
--
ALTER TABLE `subscription_plans`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `subscription_plans_slug_key` (`slug`);

--
-- Indexes for table `support_tickets`
--
ALTER TABLE `support_tickets`
  ADD PRIMARY KEY (`id`),
  ADD KEY `support_tickets_userId_idx` (`userId`);

--
-- Indexes for table `system_settings`
--
ALTER TABLE `system_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `system_settings_key_key` (`key`);

--
-- Indexes for table `ticket_messages`
--
ALTER TABLE `ticket_messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ticket_messages_ticketId_idx` (`ticketId`),
  ADD KEY `ticket_messages_senderId_fkey` (`senderId`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_email_key` (`email`);

--
-- Indexes for table `_prisma_migrations`
--
ALTER TABLE `_prisma_migrations`
  ADD PRIMARY KEY (`id`);

--
-- Constraints for dumped tables
--

--
-- Constraints for table `api_keys`
--
ALTER TABLE `api_keys`
  ADD CONSTRAINT `api_keys_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD CONSTRAINT `audit_logs_actorId_fkey` FOREIGN KEY (`actorId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `credit_transactions`
--
ALTER TABLE `credit_transactions`
  ADD CONSTRAINT `credit_transactions_walletId_fkey` FOREIGN KEY (`walletId`) REFERENCES `credit_wallets` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `credit_wallets`
--
ALTER TABLE `credit_wallets`
  ADD CONSTRAINT `credit_wallets_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `download_records`
--
ALTER TABLE `download_records`
  ADD CONSTRAINT `download_records_assetId_fkey` FOREIGN KEY (`assetId`) REFERENCES `generated_assets` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `download_records_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `generated_assets`
--
ALTER TABLE `generated_assets`
  ADD CONSTRAINT `generated_assets_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `generation_jobs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `generated_assets_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `generated_assets_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `generation_jobs`
--
ALTER TABLE `generation_jobs`
  ADD CONSTRAINT `generation_jobs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `invoices`
--
ALTER TABLE `invoices`
  ADD CONSTRAINT `invoices_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `projects`
--
ALTER TABLE `projects`
  ADD CONSTRAINT `projects_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `refresh_tokens`
--
ALTER TABLE `refresh_tokens`
  ADD CONSTRAINT `refresh_tokens_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `subscriptions`
--
ALTER TABLE `subscriptions`
  ADD CONSTRAINT `subscriptions_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `subscription_plans` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `subscriptions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `support_tickets`
--
ALTER TABLE `support_tickets`
  ADD CONSTRAINT `support_tickets_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `ticket_messages`
--
ALTER TABLE `ticket_messages`
  ADD CONSTRAINT `ticket_messages_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `ticket_messages_ticketId_fkey` FOREIGN KEY (`ticketId`) REFERENCES `support_tickets` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
