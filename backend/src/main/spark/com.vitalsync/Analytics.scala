package com.vitalsync

import org.apache.spark.sql.SparkSession

object SparkJob extends SparkSessionWrapper {

  def main(args: Array[String]): Unit = {

    import spark.implicits._

    val data = Seq(
      (1, "Alice"),
      (2, "Bob"),
      (3, "Charlie")
    )

    val df = data.toDF("id", "name")

    df.show()

    spark.stop()
  }
}