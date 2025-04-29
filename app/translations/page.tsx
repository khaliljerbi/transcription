"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TranslationStatus } from "@prisma/client";
import { ExternalLink, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Translation {
  resourceId: string;
  title: string;
  language: string;
  status: string;
  progress: number;
  updatedAt: string;
}

interface ResourceTranslations {
  resourceId: string;
  title: string;
  originalLanguage: string;
  translations: Record<
    string,
    {
      status: string;
      progress: number;
      updatedAt?: string;
      queueId?: string;
    }
  >;
}

export default function TranslationsPage() {
  const [resources, setResources] = useState<ResourceTranslations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetchTranslations();
  }, []);

  const fetchTranslations = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/translation/all");
      if (!response.ok) {
        throw new Error("Failed to fetch translations");
      }
      const data = await response.json();
      setResources(data);
    } catch (error) {
      console.error("Error fetching translations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const queueTranslation = async (
    resourceId: string,
    targetLanguage: string
  ) => {
    // Find the resource to get its original language
    const resource = resources.find((r) => r.resourceId === resourceId);
    if (!resource) return;

    try {
      const response = await fetch("/api/translation/queue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resourceId,
          sourceLanguage: resource.originalLanguage,
          targetLanguage,
          priority: 7,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to queue translation");
      }

      // Refresh translations
      await fetchTranslations();
    } catch (error) {
      console.error("Error queueing translation:", error);
    }
  };

  const filteredResources = resources.filter((resource) => {
    if (filter === "all") return true;

    // Check if any translation matches the filter
    return Object.values(resource.translations).some((t) => {
      if (filter === "pending") return t.status === TranslationStatus.PENDING;
      if (filter === "in-progress")
        return t.status === TranslationStatus.IN_PROGRESS;
      if (filter === "completed")
        return t.status === TranslationStatus.COMPLETED;
      if (filter === "failed") return t.status === TranslationStatus.FAILED;
      if (filter === "not-translated") return t.status === "NOT_TRANSLATED";
      return false;
    });
  });

  // Helper function to get badge for status
  const getStatusBadge = (status: string) => {
    let badgeClass = "";
    let label = status;

    switch (status) {
      case TranslationStatus.COMPLETED:
        badgeClass = "bg-green-500 hover:bg-green-600";
        label = "Completed";
        break;
      case TranslationStatus.IN_PROGRESS:
        badgeClass = "bg-blue-500 hover:bg-blue-600";
        label = "In Progress";
        break;
      case TranslationStatus.PENDING:
        badgeClass = "bg-yellow-500 hover:bg-yellow-600";
        label = "Pending";
        break;
      case TranslationStatus.FAILED:
        badgeClass = "bg-red-500 hover:bg-red-600";
        label = "Failed";
        break;
      case "NOT_TRANSLATED":
        badgeClass = "bg-gray-500 hover:bg-gray-600";
        label = "Not Translated";
        break;
      case "ORIGINAL_LANGUAGE":
        badgeClass = "bg-purple-500 hover:bg-purple-600";
        label = "Original";
        break;
      default:
        badgeClass = "bg-gray-500 hover:bg-gray-600";
    }

    return <Badge className={badgeClass}>{label}</Badge>;
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  // Get language name from code
  const getLanguageName = (code: string) => {
    switch (code) {
      case "en":
        return "English";
      case "fr":
        return "French";
      default:
        return code;
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Translations Manager</CardTitle>
            <CardDescription>
              Manage translations for all your content
            </CardDescription>
          </div>
          <Button onClick={fetchTranslations} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex flex-wrap gap-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              onClick={() => setFilter("all")}
              size="sm"
            >
              All
            </Button>
            <Button
              variant={filter === "pending" ? "default" : "outline"}
              onClick={() => setFilter("pending")}
              size="sm"
            >
              Pending
            </Button>
            <Button
              variant={filter === "in-progress" ? "default" : "outline"}
              onClick={() => setFilter("in-progress")}
              size="sm"
            >
              In Progress
            </Button>
            <Button
              variant={filter === "completed" ? "default" : "outline"}
              onClick={() => setFilter("completed")}
              size="sm"
            >
              Completed
            </Button>
            <Button
              variant={filter === "failed" ? "default" : "outline"}
              onClick={() => setFilter("failed")}
              size="sm"
            >
              Failed
            </Button>
            <Button
              variant={filter === "not-translated" ? "default" : "outline"}
              onClick={() => setFilter("not-translated")}
              size="sm"
            >
              Not Translated
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-8">Loading translations...</div>
          ) : filteredResources.length === 0 ? (
            <div className="text-center py-8">
              No translations found matching the selected filter
            </div>
          ) : (
            <div className="space-y-6">
              {filteredResources.map((resource) => (
                <Card key={resource.resourceId} className="overflow-hidden">
                  <CardHeader className="bg-gray-50 dark:bg-gray-800 py-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <Link
                          href={`/resources/${resource.resourceId}`}
                          className="font-medium text-lg hover:underline flex items-center"
                        >
                          {resource.title}
                          <ExternalLink className="ml-2 h-4 w-4" />
                        </Link>
                        <div className="text-sm text-gray-500">
                          Original Language:{" "}
                          {getLanguageName(resource.originalLanguage)}
                        </div>
                      </div>
                      <div>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/resources/${resource.resourceId}`}>
                            View Content
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Language</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Progress</TableHead>
                          <TableHead>Last Updated</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {/* English row */}
                        <TableRow>
                          <TableCell>English</TableCell>
                          <TableCell>
                            {getStatusBadge(
                              resource.originalLanguage === "en"
                                ? "ORIGINAL_LANGUAGE"
                                : resource.translations["en"]?.status ||
                                    "NOT_TRANSLATED"
                            )}
                          </TableCell>
                          <TableCell>
                            {resource.originalLanguage === "en" ? (
                              "100%"
                            ) : resource.translations["en"]?.status ===
                              TranslationStatus.IN_PROGRESS ? (
                              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                                <div
                                  className="bg-blue-600 h-2.5 rounded-full"
                                  style={{
                                    width: `${Math.max(
                                      5,
                                      resource.translations["en"]?.progress || 0
                                    )}%`,
                                  }}
                                ></div>
                              </div>
                            ) : resource.translations["en"]?.status ===
                              TranslationStatus.COMPLETED ? (
                              "100%"
                            ) : (
                              "0%"
                            )}
                          </TableCell>
                          <TableCell>
                            {resource.originalLanguage === "en"
                              ? "N/A"
                              : formatDate(
                                  resource.translations["en"]?.updatedAt
                                )}
                          </TableCell>
                          <TableCell>
                            {resource.originalLanguage !== "en" &&
                              !["COMPLETED", "IN_PROGRESS", "PENDING"].includes(
                                resource.translations["en"]?.status || ""
                              ) && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    queueTranslation(resource.resourceId, "en")
                                  }
                                >
                                  Translate
                                </Button>
                              )}
                            {resource.translations["en"]?.status ===
                              TranslationStatus.FAILED && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  queueTranslation(resource.resourceId, "en")
                                }
                              >
                                Retry
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>

                        {/* French row */}
                        <TableRow>
                          <TableCell>French</TableCell>
                          <TableCell>
                            {getStatusBadge(
                              resource.originalLanguage === "fr"
                                ? "ORIGINAL_LANGUAGE"
                                : resource.translations["fr"]?.status ||
                                    "NOT_TRANSLATED"
                            )}
                          </TableCell>
                          <TableCell>
                            {resource.originalLanguage === "fr" ? (
                              "100%"
                            ) : resource.translations["fr"]?.status ===
                              TranslationStatus.IN_PROGRESS ? (
                              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                                <div
                                  className="bg-blue-600 h-2.5 rounded-full"
                                  style={{
                                    width: `${Math.max(
                                      5,
                                      resource.translations["fr"]?.progress || 0
                                    )}%`,
                                  }}
                                ></div>
                              </div>
                            ) : resource.translations["fr"]?.status ===
                              TranslationStatus.COMPLETED ? (
                              "100%"
                            ) : (
                              "0%"
                            )}
                          </TableCell>
                          <TableCell>
                            {resource.originalLanguage === "fr"
                              ? "N/A"
                              : formatDate(
                                  resource.translations["fr"]?.updatedAt
                                )}
                          </TableCell>
                          <TableCell>
                            {resource.originalLanguage !== "fr" &&
                              !["COMPLETED", "IN_PROGRESS", "PENDING"].includes(
                                resource.translations["fr"]?.status || ""
                              ) && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    queueTranslation(resource.resourceId, "fr")
                                  }
                                >
                                  Translate
                                </Button>
                              )}
                            {resource.translations["fr"]?.status ===
                              TranslationStatus.FAILED && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  queueTranslation(resource.resourceId, "fr")
                                }
                              >
                                Retry
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
