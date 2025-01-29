"use client";
import Image from "next/image";
import { useEffect, useState } from "react";

import { fetchResources } from "@/actions/ressources";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getBestThumbnail } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface ResourceItem {
  id: string;
  transcriptionId: string;
  title: string;
  description: string | null;
  thumbnail: Array<{
    url: string;
    width: number;
    height: number;
  }>;
}

interface ResourceListingProps {
  pageSize?: number;
}

export default function ResourceListing({
  pageSize = 10,
}: ResourceListingProps) {
  const router = useRouter();
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResourcesData = async (page: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchResources({ page, pageSize });
      setResources(data.list);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError("Failed to load resources. Please try again later.");
      console.error("Error fetching resources:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResourcesData(currentPage);
  }, [currentPage, pageSize]);

  const handleResourceClick = (resourceId: string, transcriptionId: string) => {
    router.push(`/resources/${resourceId}?transcription=${transcriptionId}`);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <Card key={index} className="w-full">
            <div className="animate-pulse">
              <div className="flex gap-4 p-4">
                <div className="bg-gray-200 w-48 h-32 rounded"></div>
                <div className="flex-1 space-y-4 py-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500">{error}</p>
        <button
          onClick={() => fetchResourcesData(currentPage)}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resource List */}
      <div className="space-y-4">
        {resources.map((resource) => {
          const thumbnail = getBestThumbnail(resource.thumbnail);
          return (
            <Card
              key={resource.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() =>
                handleResourceClick(resource.id, resource.transcriptionId)
              }
            >
              <div className="flex flex-col sm:flex-row gap-4 p-4">
                <div className="relative w-full sm:w-48 h-32">
                  {thumbnail ? (
                    <Image
                      src={thumbnail.url}
                      alt={resource.title}
                      fill
                      className="object-cover rounded"
                      sizes="(max-width: 640px) 100vw, 192px"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center">
                      <span className="text-gray-400">No thumbnail</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <CardHeader className="p-0">
                    <CardTitle className="text-lg font-bold line-clamp-2">
                      {resource.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-3 mt-2">
                      {resource.description || "No description available"}
                    </CardDescription>
                  </CardHeader>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 py-4">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>

          {[...Array(totalPages)].map((_, index) => {
            const pageNumber = index + 1;
            if (
              pageNumber === 1 ||
              pageNumber === totalPages ||
              (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
            ) {
              return (
                <button
                  key={pageNumber}
                  onClick={() => handlePageChange(pageNumber)}
                  className={`px-4 py-2 rounded ${
                    currentPage === pageNumber
                      ? "bg-blue-500 text-white"
                      : "border hover:bg-gray-50"
                  }`}
                >
                  {pageNumber}
                </button>
              );
            } else if (
              pageNumber === currentPage - 2 ||
              pageNumber === currentPage + 2
            ) {
              return (
                <span key={pageNumber} className="px-2">
                  ...
                </span>
              );
            }
            return null;
          })}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
