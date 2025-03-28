import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Skeleton className="h-16 w-16 rounded-full" />
          </div>
          <CardTitle className="text-xl">
            <Skeleton className="h-6 w-40 mx-auto" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-64 mx-auto mt-2" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-sm text-gray-500 mb-4">
            <Skeleton className="h-4 w-48 mx-auto mb-2" />
            <Skeleton className="h-4 w-36 mx-auto mb-2" />
            <Skeleton className="h-4 w-56 mx-auto mt-2" />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Skeleton className="w-full h-10 mt-2" />
        </CardFooter>
      </Card>
    </div>
  );
}
